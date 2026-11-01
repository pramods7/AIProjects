import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

from crewai import Agent, Task, Crew
from crewai import LLM
import os
from dotenv import load_dotenv

load_dotenv()

groq_llm = LLM(
    model="groq/openai/gpt-oss-120b",
    api_key=os.getenv("GROQ_API_KEY")
)


# 1. Define the Agent
qa_agent = Agent(
    role='Senior QA Engineer',
    goal='Analyze the feature and identity potential test scenarios',
    backstory="You are a Senior QA Engineer with 15 years of experience in test planning",
    llm=groq_llm,
    verbose=True
)






# 2. Define the Task
task1 = Task(
    description='create a 5 test scenarios for a login page with email and password fields',
    expected_output='A numbered list of 5 test scenarios with brief description.',
    agent=qa_agent
)



# 3. Define the Crew
crew = Crew(
    agents=[qa_agent],
    tasks=[task1],
    verbose=True
)

# 4. Run the Crew
result = crew.kickoff()
print(result)