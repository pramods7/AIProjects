import requests
import json
import sys

def verify_ollama():
    url = "http://localhost:11434/api/generate"
    model = "llama3.2"
    
    payload = {
        "model": model,
        "prompt": "Hello, are you ready to generate test cases?",
        "stream": False
    }
    
    print(f"Testing Connectivity to Ollama at {url} with model '{model}'...")
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        data = response.json()
        print("\n✅ Success! Ollama Responded:")
        print("-" * 30)
        print(data.get("response", "No response text found"))
        print("-" * 30)
        return True
        
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Error: Could not connect to Ollama at {url}.")
        print("Please ensure Ollama is running (e.g., 'ollama serve' or desktop app).")
        return False
    except requests.exceptions.HTTPError as e:
        print(f"\n❌ HTTP Error: {e}")
        if response.status_code == 404:
             print(f"Model '{model}' might not be pulled. Try running 'ollama pull {model}'")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
        return False

if __name__ == "__main__":
    success = verify_ollama()
    if not success:
        sys.exit(1)
