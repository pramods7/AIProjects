"""A DeepEval-compatible judge model that works uniformly across OpenAI,
Groq, and local Ollama, since all three expose an OpenAI-compatible API.
`instructor` handles structured-output parsing consistently across them."""
from __future__ import annotations
import instructor
from openai import OpenAI
from deepeval.models import DeepEvalBaseLLM


class CompatibleJudge(DeepEvalBaseLLM):
    def __init__(self, model: str, base_url: str | None, api_key: str):
        self.model_name = model
        client = OpenAI(base_url=base_url, api_key=api_key)
        
        if base_url and "11434" in base_url:
            self.instructor_client = instructor.from_openai(client, mode=instructor.Mode.JSON)
        else:
            self.instructor_client = instructor.from_openai(client)

    def load_model(self):
        return self.instructor_client

    def generate(self, prompt: str, schema=None):
        client = self.load_model()
        if schema is not None:
            return client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                response_model=schema,
            )
        resp = client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            response_model=None,
        )
        return resp.choices[0].message.content

    async def a_generate(self, prompt: str, schema=None):
        return self.generate(prompt, schema)

    def get_model_name(self):
        return self.model_name
