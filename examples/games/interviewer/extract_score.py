import re

def extract_score_from_response(content):
    """
    Extract numeric score from AI response content.
    
    Patterns supported:
    - [SCORE: X/20]
    - Score: X out of 20
    - I give this answer X points
    - This answer earns X points
    - X/20 points
    - Score: X/10
    
    Returns:
    - score (int): The extracted score, or 0 if no score found
    - has_score (bool): Whether a score was found
    """
    if not content or not isinstance(content, str):
        return 0, False
    
    # Pattern 1: [SCORE: X/20]
    pattern1 = r'\[SCORE:\s*(\d+)/20\]'
    match = re.search(pattern1, content, re.IGNORECASE)
    if match:
        return int(match.group(1)), True
    
    # Pattern 2: Score: X out of 20
    pattern2 = r'Score:\s*(\d+)\s*(?:out of|\/)\s*20'
    match = re.search(pattern2, content, re.IGNORECASE)
    if match:
        return int(match.group(1)), True
    
    # Pattern 3: This answer earns X points 
    pattern3 = r'(?:earns|awarded|worth|giving|give)\s*(\d+)\s*points'
    match = re.search(pattern3, content, re.IGNORECASE)
    if match:
        return int(match.group(1)), True
    
    # Pattern 4: X/20 points
    pattern4 = r'(\d+)/20\s*points'
    match = re.search(pattern4, content, re.IGNORECASE)
    if match:
        return int(match.group(1)), True
    
    # Pattern 5: I'd give this a X out of 20
    pattern5 = r'(?:give|rate|score)\s*this\s*(?:a|an)?\s*(\d+)(?:\s*out of|\s*\/)\s*20'
    match = re.search(pattern5, content, re.IGNORECASE)
    if match:
        return int(match.group(1)), True
    
    # Pattern 6: Score: X/10 (new format)
    pattern6 = r'Score:\s*(\d+)/10'
    match = re.search(pattern6, content, re.IGNORECASE)
    if match:
        return int(match.group(1)), True
    
    return 0, False
