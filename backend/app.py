from flask import Flask, jsonify, request
from flask_cors import CORS
import csv
import json
import requests
from tourist_weights import tourist_weights
from priorityCities import priority_cities
import importlib

gares_harmonized = importlib.import_module("gares_harmonized")
station_city_mapping = gares_harmonized.station_city_mapping

app = Flask(__name__)
CORS(app)

# Load the coordinates cache
try:
    with open('coordinatesCache.json', 'r', encoding='utf-8') as cache_file:
        coordinates_cache = json.load(cache_file)
    print("Coordinates cache loaded successfully.")
except FileNotFoundError:
    print("Error: coordinatesCache.json file not found.")
    coordinates_cache = {}

def get_coordinates_from_cache(city):
    """Retrieve coordinates from cache if available."""
    return coordinates_cache.get(city.lower())

def get_coordinates_from_nominatim(city):
    """Use the Nominatim API to get coordinates for a city."""
    url = f"https://nominatim.openstreetmap.org/search?format=json&q={city}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if data:
                return [float(data[0]["lat"]), float(data[0]["lon"])]
    except Exception as e:
        print(f"Nominatim API error for {city}: {e}")
    return None

def harmonize_station_name(station_name):
    """Normalize station names by removing prefixes like 'Gare de', 'Gare d'', and 'Gare du'."""
    if station_name.startswith("Gare de ") and not station_name.startswith("Paris Gare de Lyon"):
        return station_name.replace("Gare de ", "", 1)
    elif station_name.startswith("Gare d'"):
        return station_name.replace("Gare d'", "", 1)
    elif station_name.startswith("Gare du "):
        return station_name.replace("Gare du ", "Le ", 1)
    return station_name

def get_city_from_station(station_name):
    """Return the city name corresponding to the station if found in mapping."""
    harmonized_name = harmonize_station_name(station_name)
    for city, stations in station_city_mapping.items():
        if harmonized_name in stations:
            return city
    return harmonized_name  # Return harmonized name if not found in mapping

@app.route('/api/destinations', methods=['GET'])
def get_destinations():
    origin = request.args.get('origin', '').strip().capitalize()
    destinations = {}

    # Obtenir toutes les gares associées si une ville principale est demandée
    if origin in station_city_mapping:
        origin_stations = {station.lower() for station in station_city_mapping[origin]}
    else:
        origin_stations = {origin.lower()}

    with open('Omio-Travel-Partner-Program/FR-(French)_CUSTOM.csv', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            origin_name = harmonize_station_name(row['origin_name'].strip()).lower()
            destination_name = harmonize_station_name(row['destination_name'].strip())
            destination_city = get_city_from_station(destination_name)
            travel_mode = row['travel_mode'].strip().lower()

            if origin_name in origin_stations and travel_mode == "train":
                latitude = row['destination_latitude'].strip()
                longitude = row['destination_longitude'].strip()

                # Utiliser le cache ou Nominatim si les coordonnées sont manquantes
                if not latitude or not longitude:
                    coords = get_coordinates_from_cache(destination_city) or get_coordinates_from_nominatim(destination_city)
                    if coords:
                        latitude, longitude = coords
                    else:
                        latitude, longitude = "N/A", "N/A"

                # Obtenir le poids touristique
                tourist_weight = tourist_weights.get(destination_city.capitalize(), 0)

                # Gérer les valeurs manquantes pour les prix et durées de trajet
                train_min_price = row['train_min_price'].strip()
                train_min_price = float(train_min_price) if train_min_price.replace('.', '', 1).isdigit() else float('inf')

                train_min_duration = row['train_min_duration'].strip()
                train_min_duration = int(train_min_duration) if train_min_duration.isdigit() else float('inf')

                # Si la destination est déjà dans le dictionnaire, ne conserver que le trajet avec le prix et la durée les plus bas
                if destination_city in destinations:
                    current_best = destinations[destination_city]
                    if (
                        train_min_price < current_best['train_min_price']
                        or (train_min_price == current_best['train_min_price'] and train_min_duration < current_best['train_min_duration'])
                    ):
                        destinations[destination_city] = {
                            'origin_name': origin,
                            'destination_name': destination_city,
                            'destination_latitude': latitude,
                            'destination_longitude': longitude,
                            'travel_mode': row['travel_mode'].strip(),
                            'train_min_price': train_min_price,
                            'train_min_duration': train_min_duration,
                            'link_URL': row['link_URL'].strip(),
                            'tourist_weight': tourist_weight
                        }
                else:
                    # Ajouter la destination pour la première fois
                    destinations[destination_city] = {
                        'origin_name': origin,
                        'destination_name': destination_city,
                        'destination_latitude': latitude,
                        'destination_longitude': longitude,
                        'travel_mode': row['travel_mode'].strip(),
                        'train_min_price': train_min_price,
                        'train_min_duration': train_min_duration,
                        'link_URL': row['link_URL'].strip(),
                        'tourist_weight': tourist_weight
                    }

    if not destinations:
        return jsonify({"message": "No destinations found for this departure city."}), 404

    # Trier les destinations par poids touristique et limiter à 30 si besoin
    sorted_destinations = sorted(destinations.values(), key=lambda x: x['tourist_weight'], reverse=True)
    primary_destinations = sorted_destinations[:50]

    # Remplacer les valeurs infinies pour les destinations renvoyées
    primary_destinations = [
        {
            **dest,
            'train_min_price': dest['train_min_price'] if dest['train_min_price'] != float('inf') else "N/A",
            'train_min_duration': dest['train_min_duration'] if dest['train_min_duration'] != float('inf') else "N/A"
        }
        for dest in primary_destinations
    ]

    return jsonify(primary_destinations)





@app.route('/api/secondary-destinations', methods=['GET'])
def get_secondary_destinations():
    origin = request.args.get('origin', '').strip().capitalize()
    destinations = []

    # Obtenir toutes les gares associées si une ville principale est demandée
    if origin in station_city_mapping:
        origin_stations = {station.lower() for station in station_city_mapping[origin]}
    else:
        origin_stations = {origin.lower()}

    # Récupérer les noms des destinations principales de l'API /api/destinations
    main_destinations = set()
    main_destinations_response = get_destinations()
    if main_destinations_response.status_code == 200:
        main_destinations_data = main_destinations_response.get_json()
        main_destinations = {d['destination_name'] for d in main_destinations_data}

    # Lire le fichier CSV et récupérer les destinations secondaires
    with open('Omio-Travel-Partner-Program/FR-(French)_CUSTOM.csv', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            origin_name = harmonize_station_name(row['origin_name'].strip()).lower()
            destination_name = harmonize_station_name(row['destination_name'].strip())
            destination_city = get_city_from_station(destination_name)
            travel_mode = row['travel_mode'].strip().lower()

            # Vérifier si l'origine est correcte et si le trajet est en train
            if origin_name in origin_stations and travel_mode == "train":
                # Exclure les destinations principales
                if destination_city in main_destinations:
                    continue

                latitude = row['destination_latitude'].strip()
                longitude = row['destination_longitude'].strip()

                # Utiliser le cache ou Nominatim si les coordonnées sont manquantes
                if not latitude or not longitude:
                    coords = get_coordinates_from_cache(destination_city) or get_coordinates_from_nominatim(destination_city)
                    if coords:
                        latitude, longitude = coords
                    else:
                        latitude, longitude = "N/A", "N/A"

                tourist_weight = tourist_weights.get(destination_city.capitalize(), 0)

                destinations.append({
                    'origin_name': origin,
                    'destination_name': destination_city,
                    'destination_latitude': latitude,
                    'destination_longitude': longitude,
                    'travel_mode': row['travel_mode'].strip(),
                    'train_min_price': row['train_min_price'].strip() or "N/A",
                    'train_min_duration': row['train_min_duration'].strip() or "N/A",
                    'link_URL': row['link_URL'].strip(),
                    'tourist_weight': tourist_weight
                })

    if not destinations:
        return jsonify({"message": "No secondary destinations found for this departure city."}), 404

    # Trier les destinations par poids touristique et limiter aux secondaires
    sorted_destinations = sorted(destinations, key=lambda x: x['tourist_weight'], reverse=True)
    secondary_destinations = sorted_destinations[30:] if len(sorted_destinations) > 30 else []
    
    return jsonify(secondary_destinations)



@app.route('/api/tourist-city', methods=['GET'])
def get_tourist_cities():
    return jsonify(tourist_weights)

@app.route('/api/priority-cities', methods=['GET'])
def get_priority_cities():
    return jsonify(priority_cities[:3])

# New endpoint for city suggestions
@app.route('/api/city-suggestions', methods=['GET'])
def get_city_suggestions():
    query = request.args.get('query', '').strip().lower()
    suggestions = set()

    # Ensure the query has at least 3 characters
    if len(query) >= 3:
        with open('Omio-Travel-Partner-Program/FR-(French)_CUSTOM.csv', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                origin_name = row['origin_name'].strip()
                destination_name = row['destination_name'].strip()

                # Harmonize and check if city names start with the query
                harmonized_origin = get_city_from_station(harmonize_station_name(origin_name)).lower()
                harmonized_destination = get_city_from_station(harmonize_station_name(destination_name)).lower()

                if harmonized_origin.startswith(query):
                    suggestions.add(harmonized_origin.capitalize())
                if harmonized_destination.startswith(query):
                    suggestions.add(harmonized_destination.capitalize())

    # Return suggestions as a sorted list
    return jsonify(sorted(suggestions))



@app.route('/api/accessible-cities', methods=['GET'])
def get_accessible_cities():
    origin = request.args.get('origin', '').strip().capitalize()
    direct_destinations = set()
    indirect_routes = {}

    # Obtenir toutes les gares associées si une ville principale est demandée
    origin_stations = {station.lower() for station in station_city_mapping.get(origin, [origin])}

    with open('Omio-Travel-Partner-Program/FR-(French)_CUSTOM.csv', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        # Étape 1 : Identifier les destinations directes par train
        for row in reader:
            origin_name = harmonize_station_name(row['origin_name'].strip()).lower()
            destination_name = harmonize_station_name(row['destination_name'].strip())
            destination_city = get_city_from_station(destination_name)
            travel_mode = row['travel_mode'].strip().lower()

            if origin_name in origin_stations and travel_mode == "train":
                direct_destinations.add(destination_city.lower())

        csvfile.seek(0)  # Revenir au début du fichier pour la deuxième étape

        # Étape 2 : Identifier les destinations accessibles avec une escale en train
        for row in reader:
            intermediate_origin = harmonize_station_name(row['origin_name'].strip())
            intermediate_origin_city = get_city_from_station(intermediate_origin).lower()
            final_destination = harmonize_station_name(row['destination_name'].strip())
            final_destination_city = get_city_from_station(final_destination)
            travel_mode = row['travel_mode'].strip().lower()

            if travel_mode == "train" and intermediate_origin_city in direct_destinations:
                if final_destination_city.lower() != origin.lower() and final_destination_city.lower() not in direct_destinations:
                    latitude = row['destination_latitude'].strip()
                    longitude = row['destination_longitude'].strip()

                    # Utiliser le cache ou Nominatim si les coordonnées sont manquantes
                    if not latitude or not longitude:
                        coords = get_coordinates_from_cache(final_destination_city) or get_coordinates_from_nominatim(final_destination_city)
                        if coords:
                            latitude, longitude = coords
                        else:
                            latitude, longitude = "N/A", "N/A"

                    # Ajouter la destination indirecte avec l'escale et les coordonnées
                    indirect_routes[final_destination_city] = {
                        "escale": intermediate_origin_city.capitalize(),
                        "destination_latitude": latitude,
                        "destination_longitude": longitude
                    }

    # Préparer les résultats avec les poids touristiques et les coordonnées pour chaque ville
    result = [
        {
            "city": city.capitalize(),
            "escale": details["escale"],
            "tourist_weight": tourist_weights.get(city.capitalize(), 0),
            "destination_latitude": details["destination_latitude"],
            "destination_longitude": details["destination_longitude"]
        }
        for city, details in indirect_routes.items()
    ]

    # Trier les résultats par poids touristique décroissant et limiter à 20 villes
    sorted_result = sorted(result, key=lambda x: x["tourist_weight"], reverse=True)
    return jsonify(sorted_result[:40])









@app.route('/api/secondary-accessible-cities', methods=['GET'])
def get_secondary_accessible_cities():
    origin = request.args.get('origin', '').strip().capitalize()
    secondary_destinations = []

    # Obtenir les gares associées pour la ville principale
    origin_stations = {station.lower() for station in station_city_mapping.get(origin, [origin])}

    # Récupérer les villes déjà renvoyées par /api/destinations
    main_destinations = set()
    main_destinations_response = get_destinations()
    if main_destinations_response.status_code == 200:
        main_destinations_data = main_destinations_response.get_json()
        main_destinations = {d['destination_name'].capitalize() for d in main_destinations_data}

    # Récupérer les villes déjà renvoyées par /api/secondary-destinations
    secondary_main_destinations = set()
    secondary_main_response = get_secondary_destinations()
    if secondary_main_response.status_code == 200:
        secondary_main_data = secondary_main_response.get_json()
        secondary_main_destinations = {d['destination_name'].capitalize() for d in secondary_main_data}

    # Récupérer les villes déjà renvoyées par /api/accessible-cities
    accessible_cities = set()
    accessible_cities_response = get_accessible_cities()
    if accessible_cities_response.status_code == 200:
        accessible_cities_data = accessible_cities_response.get_json()
        accessible_cities = {d['city'].capitalize() for d in accessible_cities_data}

    # Combiner les noms des villes principales, secondaires et accessibles pour les exclure
    all_main_destinations = main_destinations | secondary_main_destinations | accessible_cities

    # Lire le fichier CSV pour trouver les destinations secondaires accessibles avec escale
    with open('Omio-Travel-Partner-Program/FR-(French)_CUSTOM.csv', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            intermediate_origin = harmonize_station_name(row['origin_name'].strip())
            intermediate_origin_city = get_city_from_station(intermediate_origin).capitalize()
            final_destination = harmonize_station_name(row['destination_name'].strip())
            final_destination_city = get_city_from_station(final_destination).capitalize()
            travel_mode = row['travel_mode'].strip().lower()

            # Vérifier que le trajet est en train et que la ville n'est ni l'origine ni une destination déjà incluse
            if (
                travel_mode == "train"
                and intermediate_origin_city in main_destinations
                and final_destination_city != origin
                and final_destination_city not in all_main_destinations  # Exclure les villes principales, secondaires et accessibles
            ):
                latitude = row['destination_latitude'].strip()
                longitude = row['destination_longitude'].strip()

                # Utiliser le cache ou Nominatim pour les coordonnées manquantes
                if not latitude or not longitude:
                    coords = get_coordinates_from_cache(final_destination_city) or get_coordinates_from_nominatim(final_destination_city)
                    if coords:
                        latitude, longitude = coords
                    else:
                        latitude, longitude = "N/A", "N/A"

                tourist_weight = tourist_weights.get(final_destination_city, 0)

                # Gérer la consolidation des trajets pour la même ville
                train_min_price = row['train_min_price'].strip()
                train_min_price = float(train_min_price) if train_min_price.replace('.', '', 1).isdigit() else float('inf')

                train_min_duration = row['train_min_duration'].strip()
                train_min_duration = int(train_min_duration) if train_min_duration.isdigit() else float('inf')

                existing_entry = next((dest for dest in secondary_destinations if dest['destination_name'] == final_destination_city), None)
                if existing_entry:
                    # Conserver le trajet avec le prix et la durée les plus bas
                    if train_min_price < existing_entry['train_min_price'] or (
                        train_min_price == existing_entry['train_min_price'] and train_min_duration < existing_entry['train_min_duration']
                    ):
                        existing_entry.update({
                            'origin_name': origin,
                            'destination_name': final_destination_city,
                            'destination_latitude': latitude,
                            'destination_longitude': longitude,
                            'travel_mode': row['travel_mode'].strip(),
                            'train_min_price': train_min_price,
                            'train_min_duration': train_min_duration,
                            'link_URL': row['link_URL'].strip(),
                            'tourist_weight': tourist_weight,
                            'escale': intermediate_origin_city
                        })
                else:
                    # Ajouter la destination si elle n'existe pas déjà dans les résultats
                    secondary_destinations.append({
                        'origin_name': origin,
                        'destination_name': final_destination_city,
                        'destination_latitude': latitude,
                        'destination_longitude': longitude,
                        'travel_mode': row['travel_mode'].strip(),
                        'train_min_price': train_min_price,
                        'train_min_duration': train_min_duration,
                        'link_URL': row['link_URL'].strip(),
                        'tourist_weight': tourist_weight,
                        'escale': intermediate_origin_city
                    })

    if not secondary_destinations:
        return jsonify({"message": "No secondary accessible cities found for this departure city."}), 404

    # Trier les destinations par poids touristique et remplacer les valeurs infinies
    sorted_secondary_destinations = sorted(secondary_destinations, key=lambda x: x['tourist_weight'], reverse=True)
    sorted_secondary_destinations = [
        {
            **dest,
            'train_min_price': dest['train_min_price'] if dest['train_min_price'] != float('inf') else "N/A",
            'train_min_duration': dest['train_min_duration'] if dest['train_min_duration'] != float('inf') else "N/A"
        }
        for dest in sorted_secondary_destinations
    ]

    return jsonify(sorted_secondary_destinations)





@app.route('/api/routes-with-escale', methods=['GET'])
def get_routes_with_escale():
    origin = request.args.get('origin', '').strip().capitalize()
    destination = request.args.get('destination', '').strip().capitalize()
    routes_with_escales = []

    if not origin or not destination:
        return jsonify({"message": "Please provide both origin and destination cities."}), 400

    origin_stations = {station.lower() for station in station_city_mapping.get(origin, [origin.lower()])}
    destination_stations = {station.lower() for station in station_city_mapping.get(destination, [destination.lower()])}

    with open('Omio-Travel-Partner-Program/FR-(French)_CUSTOM.csv', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        direct_destinations_from_origin = {}
        for row in reader:
            origin_name = harmonize_station_name(row['origin_name'].strip()).lower()
            destination_name = harmonize_station_name(row['destination_name'].strip())
            intermediate_city = get_city_from_station(destination_name)
            travel_mode = row['travel_mode'].strip().lower()

            latitude = row['destination_latitude'].strip()
            longitude = row['destination_longitude'].strip()
            train_min_price = row['train_min_price'].strip()
            train_min_duration = row['train_min_duration'].strip()
            train_min_price = float(train_min_price) if train_min_price.replace('.', '', 1).isdigit() else float('inf')
            train_min_duration = int(train_min_duration) if train_min_duration.isdigit() else float('inf')

            if travel_mode == "train" and origin_name in origin_stations and intermediate_city.lower() != destination.lower():
                if intermediate_city not in direct_destinations_from_origin or \
                   (train_min_price < direct_destinations_from_origin[intermediate_city]['price_min_trajet_A'] or
                    (train_min_price == direct_destinations_from_origin[intermediate_city]['price_min_trajet_A'] and 
                     train_min_duration < direct_destinations_from_origin[intermediate_city]['train_min_duration_trajet_A'])):
                    direct_destinations_from_origin[intermediate_city] = {
                        "city": intermediate_city,
                        "train_min_duration_trajet_A": train_min_duration,
                        "price_min_trajet_A": train_min_price,
                        "destination_latitude_escale": latitude,
                        "destination_longitude_escale": longitude,
                        "tourist_weight_escale": tourist_weights.get(intermediate_city.capitalize(), 0)
                    }

        csvfile.seek(0)

        direct_routes_to_destination = {}
        for row in reader:
            intermediate_origin = harmonize_station_name(row['origin_name'].strip())
            intermediate_origin_city = get_city_from_station(intermediate_origin)
            final_destination = harmonize_station_name(row['destination_name'].strip())
            travel_mode = row['travel_mode'].strip().lower()

            latitude = row['destination_latitude'].strip()
            longitude = row['destination_longitude'].strip()
            train_min_price = row['train_min_price'].strip()
            train_min_duration = row['train_min_duration'].strip()
            train_min_price = float(train_min_price) if train_min_price.replace('.', '', 1).isdigit() else float('inf')
            train_min_duration = int(train_min_duration) if train_min_duration.isdigit() else float('inf')

            if travel_mode == "train" and intermediate_origin_city in direct_destinations_from_origin and final_destination.lower() in destination_stations:
                if intermediate_origin_city not in direct_routes_to_destination or \
                   (train_min_price < direct_routes_to_destination[intermediate_origin_city]['price_min_trajet_B'] or
                    (train_min_price == direct_routes_to_destination[intermediate_origin_city]['price_min_trajet_B'] and 
                     train_min_duration < direct_routes_to_destination[intermediate_origin_city]['train_min_duration_trajet_B'])):
                    direct_routes_to_destination[intermediate_origin_city] = {
                        "train_min_duration_trajet_B": train_min_duration,
                        "price_min_trajet_B": train_min_price,
                        "link_URL": row['link_URL'].strip()
                    }

    for intermediate_city, route_A in direct_destinations_from_origin.items():
        if intermediate_city in direct_routes_to_destination:
            route_B = direct_routes_to_destination[intermediate_city]

            train_min_duration_total = (
                route_A['train_min_duration_trajet_A'] + route_B['train_min_duration_trajet_B']
                if route_A['train_min_duration_trajet_A'] != float('inf') and route_B['train_min_duration_trajet_B'] != float('inf')
                else "N/A"
            )
            train_min_price_total = (
                route_A['price_min_trajet_A'] + route_B['price_min_trajet_B']
                if route_A['price_min_trajet_A'] != float('inf') and route_B['price_min_trajet_B'] != float('inf')
                else "N/A"
            )

            routes_with_escales.append({
                "city": destination,
                "train_min_duration_trajet_A": route_A['train_min_duration_trajet_A'] if route_A['train_min_duration_trajet_A'] != float('inf') else "N/A",
                "price_min_trajet_A": route_A['price_min_trajet_A'] if route_A['price_min_trajet_A'] != float('inf') else "N/A",
                "escale": intermediate_city,
                "tourist_weight_escale": route_A['tourist_weight_escale'],
                "destination_latitude_escale": route_A['destination_latitude_escale'],
                "destination_longitude_escale": route_A['destination_longitude_escale'],
                "train_min_duration_trajet_B": route_B['train_min_duration_trajet_B'] if route_B['train_min_duration_trajet_B'] != float('inf') else "N/A",
                "price_min_trajet_B": route_B['price_min_trajet_B'] if route_B['price_min_trajet_B'] != float('inf') else "N/A",
                "train_min_duration_total": train_min_duration_total,
                "train_min_price_total": train_min_price_total,
                "link_URL": route_B['link_URL']
            })

    if not routes_with_escales:
        return jsonify({"message": "No routes with escale found for the given cities."}), 404

    valid_durations = [route['train_min_duration_total'] for route in routes_with_escales if route['train_min_duration_total'] != "N/A"]
    if valid_durations:
        min_duration = min(valid_durations)
        for route in routes_with_escales:
            if route['train_min_duration_total'] != "N/A":
                duration_diff = route['train_min_duration_total'] - min_duration
                percent_increase = (duration_diff / min_duration) * 100

                if percent_increase < 10:
                    route['points_durée'] = 10
                elif percent_increase < 20:
                    route['points_durée'] = 9
                elif percent_increase < 30:
                    route['points_durée'] = 8
                elif percent_increase < 40:
                    route['points_durée'] = 7
                elif percent_increase < 50:
                    route['points_durée'] = 6
                elif percent_increase < 60:
                    route['points_durée'] = 5
                elif percent_increase < 70:
                    route['points_durée'] = 4
                elif percent_increase < 80:
                    route['points_durée'] = 3
                elif percent_increase < 90:
                    route['points_durée'] = 2
                elif percent_increase < 100:
                    route['points_durée'] = 1
                else:
                    route['points_durée'] = 0
            else:
                route['points_durée'] = 0

            # Calcul de total_points
            route['total_points'] = route['tourist_weight_escale'] + route['points_durée']

    return jsonify(routes_with_escales)











if __name__ == '__main__':
    app.run(debug=True)
