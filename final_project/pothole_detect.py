import tkinter as tk
from tkinter import filedialog
from ultralytics import YOLO
import cv2
from PIL import Image, ImageTk

# Load the trained YOLOv8 model
model = YOLO("best.pt")  # Ensure best.pt is in the same directory or provide full path

class VideoProcessor:
    def __init__(self, root):
        self.root = root
        self.root.title("Road Crack Detection GUI")
        
        self.canvas = tk.Canvas(root, width=800, height=600)
        self.canvas.pack()

        self.btn_select = tk.Button(root, text="Select Video", command=self.load_video)
        self.btn_select.pack()

        self.video_path = None
        self.cap = None
        self.frame = None

    def load_video(self):
        self.video_path = filedialog.askopenfilename(filetypes=[("MP4 files", "*.mp4")])
        if self.video_path:
            self.cap = cv2.VideoCapture(self.video_path)
            self.process_video()

    def process_video(self):
        if not self.cap or not self.cap.isOpened():
            print("Error: Could not open video.")
            return

        ret, frame = self.cap.read()
        if not ret:
            return
        
        results = model(frame)

        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = box.conf[0]
                label = f"Crack {conf:.2f}"
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        self.display_frame(frame)
        self.root.after(30, self.process_video)

    def display_frame(self, frame):
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(frame)
        img = img.resize((800, 600))
        imgtk = ImageTk.PhotoImage(image=img)

        self.canvas.create_image(0, 0, anchor=tk.NW, image=imgtk)
        self.canvas.image = imgtk

# Run GUI
root = tk.Tk()
app = VideoProcessor(root)
root.mainloop()
