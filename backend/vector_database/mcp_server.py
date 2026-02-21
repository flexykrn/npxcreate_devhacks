import asyncio
import json
import os
from mcp.server import Server
from mcp.server.stdio import stdio_server
import mcp.types as types

# Initialize the Server
app = Server("ScriptedRoleManager")

# ==========================================
# PERSISTENCE LAYER (The Fix)
# ==========================================
DB_FILE = "script_db.json"

def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except:
            return {"writer_layer": {}, "director_layer": {}}
    return {"writer_layer": {}, "director_layer": {}}

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="save_writer_layer",
            description="Saves the parsed spaCy JSON specifically to the Writer's isolated layer.",
            inputSchema={
                "type": "object",
                "properties": {
                    "scene_id": {"type": "string"},
                    "script_json": {"type": "string"}
                },
                "required": ["scene_id", "script_json"]
            }
        ),
        types.Tool(
            name="save_director_layer",
            description="Saves camera and lighting notes specifically to the Director's isolated layer.",
            inputSchema={
                "type": "object",
                "properties": {
                    "scene_id": {"type": "string"},
                    "director_notes": {"type": "string"}
                },
                "required": ["scene_id", "director_notes"]
            }
        ),
        types.Tool(
            name="get_merged_context",
            description="Called by FastAPI to sandwich the Director's notes on top of the Writer's script.",
            inputSchema={
                "type": "object",
                "properties": {
                    "scene_id": {"type": "string"}
                },
                "required": ["scene_id"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    # 1. Load current state from disk
    workspace = load_db()

    if name == "save_writer_layer":
        scene_id = arguments["scene_id"]
        # Parse the JSON string back to dict before saving
        workspace["writer_layer"][scene_id] = json.loads(arguments["script_json"])
        save_db(workspace) # Write to disk
        return [types.TextContent(type="text", text=f"Success: Writer data saved to disk for {scene_id}.")]
        
    elif name == "save_director_layer":
        scene_id = arguments["scene_id"]
        workspace["director_layer"][scene_id] = arguments["director_notes"]
        save_db(workspace) # Write to disk
        return [types.TextContent(type="text", text=f"Success: Director notes saved to disk for {scene_id}.")]
        
    elif name == "get_merged_context":
        scene_id = arguments["scene_id"]
        merged_payload = {
            "scene_id": scene_id,
            "writer_data": workspace["writer_layer"].get(scene_id, {}),
            "director_data": workspace["director_layer"].get(scene_id, "No director notes provided yet.")
        }
        return [types.TextContent(type="text", text=json.dumps(merged_payload, indent=2))]
        
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())