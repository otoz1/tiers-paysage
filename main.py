import threading
import time
import tkinter as tk
from tkinter import ttk, filedialog
from pynput import mouse, keyboard
import json

recording = False
playing = False
actions = []
mouse_listener = None
keyboard_listener = None

mouse_controller = mouse.Controller()
keyboard_controller = keyboard.Controller()

EXCLUDED_KEYS = {keyboard.Key.f6, keyboard.Key.f7}

start_time = None
update_timer_running = False

def record_actions():
    global mouse_listener, keyboard_listener

    def on_click(x, y, button, pressed):
        if recording:
            actions.append(('click', x, y, button, pressed, time.time()))

    def on_scroll(x, y, dx, dy):
        if recording:
            actions.append(('scroll', x, y, dx, dy, time.time()))

    def on_move(x, y):
        if recording:
            actions.append(('move', x, y, time.time()))

    def on_press(key):
        if recording and key not in EXCLUDED_KEYS:
            actions.append(('key_press', key, time.time()))

    def on_release(key):
        if recording and key not in EXCLUDED_KEYS:
            actions.append(('key_release', key, time.time()))

    mouse_listener = mouse.Listener(on_click=on_click, on_scroll=on_scroll, on_move=on_move)
    keyboard_listener = keyboard.Listener(on_press=on_press, on_release=on_release)

    mouse_listener.start()
    keyboard_listener.start()

def stop_recording():
    global mouse_listener, keyboard_listener
    if mouse_listener:
        mouse_listener.stop()
        mouse_listener = None
    if keyboard_listener:
        keyboard_listener.stop()
        keyboard_listener = None

def play_actions():
    global actions, playing, start_time
    start_time = time.time()
    update_timer("Playing")
    while playing:
        if not actions:
            time.sleep(1)
            continue
        base_time = actions[0][-1]
        for action in actions:
            if not playing:
                break
            delay = action[-1] - base_time
            time.sleep(delay)
            base_time = action[-1]
            if action[0] == 'click':
                _, x, y, button, pressed, _ = action
                mouse_controller.position = (x, y)
                if pressed:
                    mouse_controller.press(button)
                else:
                    mouse_controller.release(button)
            elif action[0] == 'scroll':
                _, x, y, dx, dy, _ = action
                mouse_controller.position = (x, y)
                mouse_controller.scroll(dx, dy)
            elif action[0] == 'move':
                _, x, y, _ = action
                mouse_controller.position = (x, y)
            elif action[0] == 'key_press':
                _, key, _ = action
                try:
                    keyboard_controller.press(key.char if hasattr(key, 'char') else key)
                except: pass
            elif action[0] == 'key_release':
                _, key, _ = action
                try:
                    keyboard_controller.release(key.char if hasattr(key, 'char') else key)
                except: pass

def toggle_record():
    global recording, actions, start_time
    if not recording:
        actions = []
        recording = True
        start_time = time.time()
        status_var.set("Recording...")
        update_timer("Recording")
        threading.Thread(target=record_actions, daemon=True).start()
    else:
        recording = False
        stop_recording()
        stop_timer()
        status_var.set("Stopped.")
        timer_var.set("")

def toggle_play():
    global playing, start_time
    if not playing:
        playing = True
        status_var.set("Playing...")
        start_time = time.time()
        update_timer("Playing")
        threading.Thread(target=play_actions, daemon=True).start()
    else:
        stop_playing()
        status_var.set("Stopped.")
        timer_var.set("")

def on_hotkey(key):
    if key == keyboard.Key.f6:
        toggle_record()
    elif key == keyboard.Key.f7:
        toggle_play()

def toggle_always_on_top():
    root.attributes("-topmost", always_on_top_var.get())

def stop_playing():
    global playing
    playing = False
    stop_timer()

def update_timer(mode):
    def updater():
        global update_timer_running
        update_timer_running = True
        while (recording if mode == "Recording" else playing):
            elapsed = int(time.time() - start_time)
            mins, secs = divmod(elapsed, 60)
            timer_var.set(f"{mode} Time: {mins:02}:{secs:02}")
            time.sleep(1)
        update_timer_running = False
    if not update_timer_running:
        threading.Thread(target=updater, daemon=True).start()

def stop_timer():
    global update_timer_running
    update_timer_running = False

def serialize_action(action):
    if action[0] == 'click':
        return [action[0], action[1], action[2], str(action[3]), action[4], action[5]]
    elif action[0] in ['key_press', 'key_release']:
        key = action[1]
        try:
            key = key.char if hasattr(key, 'char') and key.char else str(key)
        except:
            key = str(key)
        return [action[0], key, action[2]]
    elif action[0] == 'scroll':
        return [action[0], action[1], action[2], action[3], action[4], action[5]]
    elif action[0] == 'move':
        return [action[0], action[1], action[2], action[3]]
    return []

def deserialize_action(action):
    if action[0] == 'click':
        return (action[0], action[1], action[2], getattr(mouse.Button, action[3].split('.')[-1]), action[4], action[5])
    elif action[0] in ['key_press', 'key_release']:
        try:
            key = keyboard.KeyCode.from_char(action[1])
        except:
            try:
                key = getattr(keyboard.Key, action[1].split('.')[-1])
            except:
                key = action[1]
        return (action[0], key, action[2])
    elif action[0] == 'scroll':
        return (action[0], action[1], action[2], action[3], action[4], action[5])
    elif action[0] == 'move':
        return (action[0], action[1], action[2], action[3])
    return None

def save_macro():
    if not actions:
        status_var.set("Nothing to save.")
        return
    file_path = filedialog.asksaveasfilename(defaultextension=".oto", filetypes=[("OTO Macro", "*.oto")])
    if file_path:
        with open(file_path, 'w') as f:
            json.dump([serialize_action(a) for a in actions], f)
        status_var.set(f"Saved: {file_path.split('/')[-1]}")

def load_macro():
    global actions
    file_path = filedialog.askopenfilename(filetypes=[("OTO Macro", "*.oto")])
    if file_path:
        with open(file_path, 'r') as f:
            raw = json.load(f)
            actions = [deserialize_action(a) for a in raw]
        status_var.set(f"Loaded: {file_path.split('/')[-1]}")

# GUI
root = tk.Tk()
root.title("TinyTask Linux")
root.geometry("250x240")
root.configure(bg="#1e1e1e")
root.resizable(False, False)
root.attributes("-topmost", True)

style = ttk.Style()
style.theme_use("default")
style.configure("TButton", font=("Segoe UI", 10), padding=6, background="#333", foreground="white")
style.map("TButton", background=[("active", "#555")])

status_var = tk.StringVar(value="Idle")
timer_var = tk.StringVar(value="")
always_on_top_var = tk.BooleanVar(value=True)

ttk.Button(root, text="Record (F6)", command=toggle_record).pack(pady=2)
ttk.Button(root, text="Play (F7)", command=toggle_play).pack(pady=2)
ttk.Button(root, text="Stop", command=lambda: [stop_recording(), stop_playing(), status_var.set("Stopped."), timer_var.set("")]).pack(pady=2)
ttk.Button(root, text="Save Macro", command=save_macro).pack(pady=2)
ttk.Button(root, text="Load Macro", command=load_macro).pack(pady=2)
ttk.Checkbutton(root, text="Always on Top", variable=always_on_top_var, command=toggle_always_on_top).pack(pady=2)
tk.Label(root, textvariable=status_var, fg="gray", bg="#1e1e1e").pack()
tk.Label(root, textvariable=timer_var, fg="lightgreen", bg="#1e1e1e", font=("Consolas", 10)).pack()

# Hotkey listener
threading.Thread(target=lambda: keyboard.Listener(on_press=on_hotkey).run(), daemon=True).start()

root.mainloop()

