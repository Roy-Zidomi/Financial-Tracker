import re
import string


def normalize_text(text: str) -> str:
    lowered = text.lower().strip()
    without_punctuation = lowered.translate(str.maketrans("", "", string.punctuation))
    without_numbers = re.sub(r"\d+", " ", without_punctuation)
    compacted = re.sub(r"\s+", " ", without_numbers)
    return compacted.strip()
