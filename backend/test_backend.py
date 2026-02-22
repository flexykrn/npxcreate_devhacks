"""
Quick test script to verify backend functionality
Run this after starting the backend server
"""

import requests
import json
import time

API_BASE = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{API_BASE}/health")
        data = response.json()
        print(f"✅ Health check passed")
        print(f"   Status: {data['status']}")
        print(f"   GPU Available: {data['gpu_available']}")
        print(f"   Models Loaded: {data['models_loaded']}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_full_pipeline():
    """Test full pipeline processing"""
    print("\n🔍 Testing full pipeline...")
    
    screenplay = """
INT. COFFEE SHOP - DAY

A cozy coffee shop buzzes with morning activity.

JANE
(nervously)
I've been meaning to tell you something.

JOHN
What is it?

JANE
I'm leaving for Paris next month.

JOHN
(shocked)
Paris? For how long?

JANE
Maybe forever.
"""
    
    try:
        print("   Sending screenplay for processing...")
        response = requests.post(
            f"{API_BASE}/api/v1/process-full-pipeline",
            json={
                "raw_script": screenplay,
                "tone_target": "dramatic"
            },
            timeout=300  # 5 minutes
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Pipeline completed successfully")
            print(f"   Session ID: {data['session_id']}")
            print(f"   Status: {data['status']}")
            print(f"   Parsed Scenes: {data.get('parsed_scenes', 0)}")
            print(f"   Parsed Dialogues: {data.get('parsed_dialogues', 0)}")
            print(f"   Embeddings Generated: {data.get('embeddings_generated', 0)}")
            print(f"\n   Final Screenplay Preview:")
            print(f"   {data.get('final_screenplay', '')[:200]}...")
            return True
        else:
            print(f"❌ Pipeline failed: {response.status_code}")
            print(f"   {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Pipeline test failed: {e}")
        return False

def test_stage_by_stage():
    """Test stage-by-stage processing"""
    print("\n🔍 Testing stage-by-stage pipeline...")
    
    screenplay = """
INT. OFFICE - DAY

ALEX sits at a desk, typing furiously.

ALEX
I need to finish this by tonight.
"""
    
    try:
        # Create session
        print("   Creating session...")
        response = requests.post(
            f"{API_BASE}/api/v1/session/create",
            data={"raw_script": screenplay, "tone_target": "tense"}
        )
        session_data = response.json()
        session_id = session_data['session_id']
        print(f"   ✓ Session created: {session_id}")
        
        # Parse
        print("   Parsing...")
        response = requests.post(
            f"{API_BASE}/api/v1/parse/",
            json={"session_id": session_id}
        )
        print(f"   ✓ Parse completed")
        
        # Analyze
        print("   Analyzing...")
        response = requests.post(
            f"{API_BASE}/api/v1/analyze/",
            json={"session_id": session_id}
        )
        print(f"   ✓ Analysis completed")
        
        # Enhance
        print("   Enhancing...")
        response = requests.post(
            f"{API_BASE}/api/v1/enhance/",
            json={"session_id": session_id}
        )
        print(f"   ✓ Enhancement completed")
        
        # Finalize
        print("   Finalizing...")
        response = requests.post(
            f"{API_BASE}/api/v1/finalize/",
            json={"session_id": session_id, "include_formatting": True}
        )
        print(f"   ✓ Finalization completed")
        
        # Get result
        print("   Retrieving result...")
        response = requests.get(f"{API_BASE}/api/v1/session/{session_id}/result")
        data = response.json()
        
        print(f"✅ Stage-by-stage test passed")
        print(f"   Final screenplay preview:")
        print(f"   {data.get('final_screenplay', '')[:200]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Stage-by-stage test failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🎬 ScriptED Backend Test Suite")
    print("=" * 60)
    print()
    
    # Test health
    if not test_health():
        print("\n❌ Backend is not running or not healthy!")
        print("Please start the backend with: python main.py")
        exit(1)
    
    print("\n⏳ Waiting 5 seconds before running tests...")
    time.sleep(5)
    
    # Test full pipeline
    test_full_pipeline()
    
    # Test stage by stage
    test_stage_by_stage()
    
    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)
