from flask import Flask, jsonify
from flask_cors import CORS
from tourist_weights import tourist_weights

app = Flask(__name__)
CORS(app)  # Activer CORS pour toutes les routes

# Définir une route pour renvoyer les poids touristiques
@app.route('/api/tourist-city', methods=['GET'])
def get_tourist_cities():
    return jsonify(tourist_weights)

if __name__ == '__main__':
    app.run(debug=True)
