import ollama

def generate_test_cases_from_ai(user_story: str):
    """
    Interacts with the local Ollama instance to generate test cases based on a user story.
    """
    system_prompt = (
        "You are an expert Quality Assurance Engineer. "
        "Given a User Story, generate a comprehensive set of manual test cases. "
        "Provide the output in a clean Markdown format with the following columns for each test case: "
        "Test Case ID, Description, Pre-conditions, Steps, Expected Result, and Priority (High/Medium/Low)."
    )

    prompt = f"User Story: {user_story}\n\nPlease generate the test cases."

    try:
        response = ollama.chat(
            model='llama3.2',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': prompt},
            ],
        )
        return response['message']['content']
    except Exception as e:
        return f"Error connecting to Ollama: {str(e)}. Please ensure Ollama is running and 'llama3.2' model is pulled."

if __name__ == "__main__":
    # Quick test
    sample_story = "As a user, I want to be able to reset my password so that I can regain access to my account if I forget it."
    print(generate_test_cases_from_ai(sample_story))
