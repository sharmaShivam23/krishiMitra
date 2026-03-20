import json
import urllib.request
import urllib.parse
import os
import time
from typing import Dict, Any

def translate_text(text, target_lang, retries=5):
    if not isinstance(text, str):
        return text
    if not text.strip():
        return text

    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target_lang}&dt=t&q={urllib.parse.quote(text)}"
    
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                translated = "".join([x[0] for x in data[0]])
                return translated
        except Exception as e:
            print(f"Error translating '{text[:10]}...': {e}. Retrying {i+1}/{retries}...")
            time.sleep(2 * (i + 1))
    
    return text  # Fallback to English if all retries fail

def translate_dict(d: Dict[str, Any], target_lang: str, current_lang_data: Dict[str, Any] = None) -> Dict[str, Any]:
    translated: Dict[str, Any] = {}
    if current_lang_data is None:
        current_lang_data = {}

    for k, v in d.items():
        # If the key is already fully translated as a dict or string, skip it
        if k in current_lang_data and current_lang_data[k] != v and current_lang_data[k]:
            translated[k] = current_lang_data[k]
            continue
            
        print(f"Translating key: {k}")
        if isinstance(v, dict):
            sub_current = current_lang_data.get(k, {})
            translated[k] = translate_dict(v, target_lang, sub_current)
        elif isinstance(v, str):
            translated[k] = translate_text(v, target_lang)
            time.sleep(0.1) # Small delay to avoid rate limiting
        else:
            translated[k] = v
            
    return translated

def main():
    base_dir = r"c:\Users\HP\Desktop\ProjectFolder\krishimitra\messages"
    with open(os.path.join(base_dir, "en.json"), "r", encoding="utf-8") as f:
        en_data = json.load(f)

    langs = [
        "hi", "pa", "mr", "bn", "te", "ta",
        "as", "gu", "kn", "ml", "or", "ur",
        "sa", "sd", "ne", "mai", "doi", "gom", 
        "sat", "ks", "mni"
    ]
    
    for lang in langs:
        target_path = os.path.join(base_dir, f"{lang}.json")
        current_data = {}
        if os.path.exists(target_path):
            try:
                with open(target_path, "r", encoding="utf-8") as f:
                    current_data = json.load(f)
            except:
                pass
                
        if os.path.exists(target_path) and os.path.getsize(target_path) > 25000:
            print(f"Skipping {lang}, looks mostly translated.")
            continue
            
        print(f"\n--- Translating to {lang} ---")
        translated_data = translate_dict(en_data, lang, current_data)
        
        with open(target_path, "w", encoding="utf-8") as f:
            json.dump(translated_data, f, ensure_ascii=False, indent=2)
        print(f"Finished {lang}.json")

if __name__ == "__main__":
    main()
