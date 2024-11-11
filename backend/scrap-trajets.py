import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Initialisation de Selenium
options = webdriver.ChromeOptions()
options.add_argument('--headless')  # Exécute en mode sans interface
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Liste des destinations avec leurs IDs de gare respectifs
destinations = [
    {"name": "Londres", "id": "2643743"},
    {"name": "Bruxelles", "id": "2800866"},
    {"name": "Anderlecht", "id": "2802845"},
    {"name": "Strasbourg", "id": "2973783"},
    {"name": "Schaerbeek", "id": "2786577"},
    {"name": "Rouen", "id": "2982652"},
    {"name": "Lille", "id": "2998324"},
    {"name": "Molenbeek-Saint-Jean", "id": "2791537"},
    {"name": "Rennes", "id": "2983990"},
    {"name": "Reims", "id": "2984114"},
    {"name": "Ixelles", "id": "2795107"},
    {"name": "Londres", "id": "2643743"},
    {"name": "Luxembourg", "id": "2960316"},
    {"name": "Rotterdam", "id": "2747891"},
    {"name": "Anvers", "id": "2803138"},
    {"name": "Esch-sur-Alzette", "id": "2960421"},
    {"name": "Lyon", "id": "2996944"},
    {"name": "Gand", "id": "2797656"},
    {"name": "Dudelange", "id": "2960681"},
    {"name": "Charleroi", "id": "2800481"},
    {"name": "Schifflange", "id": "2960044"},
    {"name": "Amsterdam", "id": "2759794"},
    {"name": "Marseille", "id": "2995469"},
    {"name": "Genève", "id": "2660646"},
    {"name": "La Haye", "id": "2747373"},
    {"name": "Bâle", "id": "2661604"},
    {"name": "Cologne", "id": "2886242"},
    {"name": "Utrecht", "id": "2745912"},
    {"name": "Francfort", "id": "2925533"},
    {"name": "Stuttgart", "id": "2825297"},
    {"name": "Eindhoven", "id": "2756253"},
    {"name": "Zurich", "id": "2657896"},
    {"name": "Birmingham", "id": "2655603"},
    {"name": "Toulouse", "id": "2972315"},
    {"name": "Lausanne", "id": "2659994"},
    {"name": "Sheffield", "id": "2638077"},
    {"name": "Berne", "id": "2661552"},
    {"name": "Leeds", "id": "2644688"},
    {"name": "Luzern", "id": "2659811"},
    {"name": "Bristol", "id": "2654675"},
    {"name": "Essen", "id": "2928810"},
    {"name": "Schaan", "id": "3041997"},
    {"name": "Munich", "id": "2867714"},
    {"name": "Liverpool", "id": "2644210"},
    {"name": "Turin", "id": "3165524"},
    {"name": "Nice", "id": "2990440"},
    {"name": "Groningue", "id": "2755251"},
    {"name": "Winterthur", "id": "2657970"},
    {"name": "Sankt Gallen", "id": "2658822"},
    {"name": "Cardiff", "id": "2653822"},
    {"name": "Manchester", "id": "2643123"},
    {"name": "Monaco", "id": "2993458"},
    {"name": "Barcelone", "id": "3128760"},
    {"name": "Milan", "id": "3173435"},
    {"name": "Vaduz", "id": "3042030"},
    {"name": "Triesen", "id": "3042039"},
    {"name": "Eschen", "id": "3042326"},
    {"name": "Mauren", "id": "3041978"},
    {"name": "Edinburgh", "id": "2650225"},
    {"name": "Ruggell", "id": "3041867"},
    {"name": "Lugano", "id": "2659993"},
    {"name": "Berlin", "id": "2950159"},
    {"name": "Hambourg", "id": "2911298"},
    {"name": "Glasgow", "id": "2648579"},
    {"name": "Salzburg", "id": "2766824"},
    {"name": "Innsbruck", "id": "2775220"},
    {"name": "Brescia", "id": "3181554"},
    {"name": "Leipzig", "id": "2879139"},
    {"name": "Parma", "id": "3171457"},
    {"name": "Gasteiz / Vitoria", "id": "3104499"},
    {"name": "Reggio nell'Emilia", "id": "3169361"},
    # Ajoutez d'autres villes ici avec leurs IDs
]

# Ville de départ (Paris)
departure_city = "Paris"
departure_id = "2988507"

# Base de l'URL
base_url = "https://www.chronotrains.com/fr/trip"

def get_train_data(departure_id, destination_id, destination_name):
    url = f"{base_url}/{departure_id}-{departure_city}/{destination_id}-{destination_name}?maxTime=8"
    driver.get(url)
    
    # Attendre que l'élément contenant les infos de trajet soit présent
    try:
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "p.bottom-0")))
        time_price_text = driver.find_element(By.CSS_SELECTOR, "p.bottom-0").text
        time_info, price_info = time_price_text.split("·")  # Séparation de la durée et du prix
        time_info = time_info.strip().replace("Direct ·", "").strip()  # Nettoyage de la durée
        price_info = price_info.replace("À partir de", "").strip()  # Nettoyage du prix
        return (departure_city, destination_name, time_info, price_info)
    except Exception as e:
        print(f"Erreur de récupération des données pour {destination_name}: {e}")
        return (departure_city, destination_name, "N/A", "N/A")

# Collecte des données pour chaque destination
all_data = []
for destination in destinations:
    data = get_train_data(departure_id, destination["id"], destination["name"])
    all_data.append(data)

# Organiser les données dans un DataFrame et les enregistrer en CSV
df = pd.DataFrame(all_data, columns=['Ville de départ', 'Destination', 'Temps', 'Prix'])
df.to_csv('train_data_paris_destinations.csv', index=False)
print("Données sauvegardées dans 'train_data_paris_destinations.csv'")

# Fermer le navigateur
driver.quit()
