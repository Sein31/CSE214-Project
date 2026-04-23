import os
import requests
from dotenv import load_dotenv

# .env dosyasından API anahtarını al
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("API anahtarı bulunamadı!")
else:
    print("Modeller sorgulanıyor...\n")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        print("Kullanabileceğiniz Modeller:")
        print("-" * 30)
        for model in data.get("models", []):
            # Sadece içerik üretebilen (generateContent) modelleri listele
            if "generateContent" in model.get("supportedGenerationMethods", []):
                print(model["name"])
    else:
        print(f"Hata oluştu: {response.status_code}")
        print(response.text)