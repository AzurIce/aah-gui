import { Button } from "antd";
import { useEffect, useRef } from "react";
import "./App.css";
import { invoke } from "@tauri-apps/api/tauri";

function App() {
  const canvasRef = useRef(null);

  useEffect(() => {
    async function getImageAndDraw() {
      // 从后端函数获取图像数据
      const imageData: Uint8Array = new Uint8Array(await invoke("get_image"));
      drawImageOnCanvas(imageData);
    }
    getImageAndDraw();
  }, []);

  async function drawImageOnCanvas(imageData: Uint8Array) {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    const ctx = canvas!.getContext("bitmaprenderer");
    // 假设imageData是从后端接收到的Uint8Array
    const blob = new Blob([imageData], { type: "image/bmp" });
    const bitmap = await createImageBitmap(blob);
    ctx?.transferFromImageBitmap(bitmap);
  }

  return (
    <div className="container">
      <canvas ref={canvasRef} style={{
        width: '100%',
        height: '100%',
        aspectRatio: 1,
      }}></canvas>
      <Button type="primary">确认</Button>
    </div>
  );
}

export default App;
