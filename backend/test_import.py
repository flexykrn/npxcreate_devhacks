#!/usr/bin/env python
"""Test script to verify model_registry has the correct method."""

import sys
sys.path.insert(0, r"D:\SEM6\npxcreate_devhacks\backend")

from model_loader import model_registry

print("Testing ModelRegistry...")
print(f"ModelRegistry class: {type(model_registry)}")
print(f"Has get_model method: {hasattr(model_registry, 'get_model')}")
print(f"Has get method: {hasattr(model_registry, 'get')}")

# Try to call get_model
try:
    result = model_registry.get_model('test')
    print("✅ get_model() works!")
except ValueError as e:
    print(f"✅ get_model() works (raised expected ValueError: {e})")
except AttributeError as e:
    print(f"❌ get_model() FAILED: {e}")

# Try to call get (should fail)
try:
    result = model_registry.get('test')
    print("❌ .get() method exists (SHOULD NOT!)")
except AttributeError:
    print("✅ .get() method does not exist (correct!)")

print("\nConclusion: Code is correct if get_model works and get doesn't exist")
