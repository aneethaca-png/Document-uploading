import re


def extract_variables(body: str) -> list[str]:
    matches = re.findall(r'\{\{(\w+)\}\}', body)
    return list(dict.fromkeys(matches))  # deduplicate, preserve insertion order
