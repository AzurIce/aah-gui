import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import { invoke } from "@tauri-apps/api/tauri";

function App() {
  const canvasRef = useRef(null);
  // const [connected, setConnected] = useState(false);
  let connected = false;

  useEffect(() => {
    async function connectToDeviceAndDrawScreen() {
      try {
        // 连接设备并获取图像数据
        await invoke("connect", { serial: "127.0.0.1:16384" });
        // setConnected(true); // 确保在连接成功后设置状态为true
        connected = true;
        console.log(connected)
        // 等待连接成功后再获取并绘制屏幕数据
        if (connected) {
          const imageData: Uint8Array = new Uint8Array(await invoke("get_screen"));
          drawImageOnCanvas(imageData);
        }
      } catch (error) {
        console.error("Failed to connect or get screen:", error);
      }
    }

    connectToDeviceAndDrawScreen();
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
