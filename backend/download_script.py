import ftplib
import os
import pandas as pd
import gzip
import shutil
from datetime import datetime

# Informations du serveur FTP
FTP_HOST = "products.impact.com"
FTP_USER = "ps-ftp_5792677"
FTP_PASS = "eLz}D8q2h-"
FTP_PORT = 21

# Répertoire local où le fichier sera téléchargé
LOCAL_DIR = "./Omio-Travel-Partner-Program/"
FILENAME_COMPRESSED = "FR-(French)_CUSTOM.csv.gz"
FILENAME = "FR-(French)_CUSTOM.csv"

# Fonction pour télécharger le fichier compressé via FTP
def download_file():
    try:
        # Connexion au serveur FTP
        ftp = ftplib.FTP()
        ftp.connect(FTP_HOST, FTP_PORT)
        ftp.login(FTP_USER, FTP_PASS)

        # Assurez-vous que le répertoire local existe
        if not os.path.exists(LOCAL_DIR):
            os.makedirs(LOCAL_DIR)

        # Chemin local pour enregistrer le fichier compressé
        local_filepath_compressed = os.path.join(LOCAL_DIR, FILENAME_COMPRESSED)

        # Téléchargement du fichier compressé depuis le serveur FTP
        with open(local_filepath_compressed, 'wb') as local_file:
            ftp.retrbinary(f"RETR {FILENAME_COMPRESSED}", local_file.write)
        
        ftp.quit()
        print(f"[{datetime.now()}] Fichier '{FILENAME_COMPRESSED}' téléchargé avec succès dans '{LOCAL_DIR}'")
    
    except ftplib.all_errors as e:
        print(f"[{datetime.now()}] Erreur lors du téléchargement du fichier : {e}")

# Fonction pour décompresser le fichier .gz
def decompress_file():
    local_filepath_compressed = os.path.join(LOCAL_DIR, FILENAME_COMPRESSED)
    local_filepath = os.path.join(LOCAL_DIR, FILENAME)
    
    # Décompresse le fichier si le fichier compressé existe
    if os.path.exists(local_filepath_compressed):
        with gzip.open(local_filepath_compressed, 'rb') as f_in:
            with open(local_filepath, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        print(f"[{datetime.now()}] Fichier '{FILENAME_COMPRESSED}' décompressé en '{FILENAME}'")
    else:
        print(f"[{datetime.now()}] Le fichier compressé '{FILENAME_COMPRESSED}' n'existe pas.")

# Fonction pour traiter le fichier décompressé avec pandas
def process_csv():
    filepath = os.path.join(LOCAL_DIR, FILENAME)
    if os.path.exists(filepath):
        # Charger le fichier CSV dans un DataFrame pandas
        df = pd.read_csv(filepath)
        
        # Exemple de traitement : afficher les premières lignes
        print("Aperçu des données :")
        print(df.head())

        # Vous pouvez ajouter d'autres traitements ici
    else:
        print(f"[{datetime.now()}] Le fichier '{FILENAME}' n'existe pas dans le répertoire '{LOCAL_DIR}'")

# Automatisation du téléchargement, de la décompression et du traitement
if __name__ == "__main__":
    download_file()       # Télécharge le fichier compressé via FTP
    decompress_file()     # Décompresse le fichier
    process_csv()         # Traite le fichier décompressé avec pandas
