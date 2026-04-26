import chainlit as cl

from agents import run_chatbot


@cl.on_chat_start
async def on_chat_start() -> None:
    await cl.Message(
        content=(
            "Merhaba, DataPulse AI asistanina hos geldiniz.\n"
            "Sorularinizi dogal dilde sorabilirsiniz."
        )
    ).send()


@cl.on_message
async def on_message(message: cl.Message) -> None:
    session = cl.user_session
    role = session.get("role", "ADMIN")
    user_id = session.get("user_id")
    store_id = session.get("store_id")

    result = run_chatbot(
        question=message.content,
        role=role,
        user_id=user_id,
        store_id=store_id,
    )

    visualization = result.get("visualization_code")
    if visualization and visualization.get("chart_type") not in [None, "none"]:
        await cl.Message(
            content=(
                f"{result.get('answer', 'Yanit uretilemedi.')}\n\n"
                f"Grafik onerisi: {visualization.get('chart_type')} - "
                f"{visualization.get('title', 'Baslik yok')}"
            )
        ).send()
        return

    await cl.Message(content=result.get("answer", "Yanit uretilemedi.")).send()
