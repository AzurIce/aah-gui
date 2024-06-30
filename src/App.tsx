import { createSignal, onMount } from "solid-js";
import logo from "./assets/logo.svg";
import { invoke } from "@tauri-apps/api/core";
import { TextField, Button } from "@suid/material";
import "./App.css";

const local = "127.0.0.1:16384";

function App() {
  let canvas: HTMLCanvasElement | undefined;
  const [greetMsg, setGreetMsg] = createSignal("");
  const [name, setName] = createSignal("");
  // 序列号
  const [serial, setSerial] = createSignal("");

  const [connected, setConnected] = createSignal(false);

  // onMount(async () => {
  //   try {
  //     await invoke("connect", { serial: "1577208554005QT" });
  //     // setConnected(true); // 确保在连接成功后设置状态为true
  //     setConnected(true)
  //     console.log(connected)

  //     renderScreen()
  //   } catch (error) {
  //     console.error("Failed to connect or get screen:", error);
  //   }
  // })

  // 输入序列号，点击确认按钮，获取屏幕画面
  async function getScreen() {
    try {
      await invoke("connect", { serial: serial() });
      // setConnected(true); // 确保在连接成功后设置状态为true
      setConnected(true)
      console.log(connected)

      renderScreen()
    } catch (error) {
      console.error("Failed to connect or get screen:", error);
    }

  }

  async function renderScreen() {
    // 连接设备并获取图像数据
    // 等待连接成功后再获取并绘制屏幕数据
    if (connected()) {
      console.time("aaa")
      const imageData: Uint8Array = new Uint8Array(await invoke("get_screen"));
      console.timeLog("aaa")
      drawImageOnCanvas(imageData);
      console.timeEnd("aaa")
    }
  }

  async function drawImageOnCanvas(imageData: Uint8Array) {
    const ctx = canvas!.getContext("bitmaprenderer");
    // 假设imageData是从后端接收到的Uint8Array
    const blob = new Blob([imageData], { type: "image/bmp" });
    const bitmap = await createImageBitmap(blob);
    ctx?.transferFromImageBitmap(bitmap);
  }

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name: name() }));
  }

  async function updateScreen() {
    await invoke("update_screen")
    renderScreen()
  }

  return (
    <div class="container">
      {/* 将TextField与serial()绑定 */}
      <TextField
        label="序列号"
        variant="outlined"
        value={serial()}
        onChange={(e) => {
          const newSerial = e.currentTarget.value;
          setSerial(newSerial);
          console.log("现在的序列号是：", newSerial);
        }}
      />
      <Button variant="contained" onClick={getScreen}>获取画面</Button>
      <canvas ref={canvas} style={{
        width: '100%',
        height: '100%',
        "aspect-ratio": "1"
      }}></canvas>
      <Button variant="outlined" onClick={updateScreen}>更新画面</Button>




      <h1>Welcome to Tauri!</h1>

      <div class="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" class="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" class="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://solidjs.com" target="_blank">
          <img src={logo} class="logo solid" alt="Solid logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and Solid logos to learn more.</p>

      <form
        class="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      <p>{greetMsg()}</p>
    </div>
  );
}

export default App;
