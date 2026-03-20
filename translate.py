import json
import urllib.request
import urllib.parse
import os
from typing import Dict, Any

def translate_text(text, target_lang):
    if not isinstance(text, str):
        return text
    if not text.strip():
        return text

    # Simple logic using a free translation API or google translate URL hack (not recommended for production, but works for script)
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target_lang}&dt=t&q={urllib.parse.quote(text)}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return "".join([x[0] for x in data[0]])
    except Exception as e:
        print(f"Error translating '{text}': {e}")
        return text

def translate_dict(d: Dict[str, Any], target_lang: str) -> Dict[str, Any]:
    translated: Dict[str, Any] = {}
    for k, v in d.items():
        if isinstance(v, dict):
            translated[k] = translate_dict(v, target_lang)
        elif isinstance(v, str):
            translated[k] = translate_text(v, target_lang)
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
        print(f"Translating to {lang}...")
        translated_data = translate_dict(en_data, lang)
        with open(os.path.join(base_dir, f"{lang}.json"), "w", encoding="utf-8") as f:
            json.dump(translated_data, f, ensure_ascii=False, indent=2)
        print(f"Finished {lang}.json")

if __name__ == "__main__":
    main()
