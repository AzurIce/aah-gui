import { createSignal, For, createEffect, onMount, onCleanup, Show } from "solid-js";
import { UnlistenFn, emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { TextField, Button, IconButton, Card, CircularProgress, AppBar, Toolbar } from "@suid/material";
import "./App.css";
import { Refresh } from "@suid/icons-material";
import { event } from "@tauri-apps/api";

const local = "127.0.0.1:16384";

function App() {
  let canvas: HTMLCanvasElement | undefined;

  // 设备序列号
  const [serial, setSerial] = createSignal("127.0.0.1:5555");
  // 当前连接状态
  const [connected, setConnected] = createSignal(false);
  const [connecting, setConnecting] = createSignal(false);
  // 更新屏幕状态
  const [screenUpdating, setScreenUpdating] = createSignal(false);
  // 更新任务状态
  const [taskUpdating, setTaskUpdating] = createSignal(false);
  // 执行任务情况的日志信息
  const [log, setLog] = createSignal<string[]>([]);
  // 任务列表（字符串型数组）
  const [tasks, setTasks] = createSignal<string[]>([]);
  // 当前正在执行的任务
  const [currentTask, setCurrentTask] = createSignal("");
  // 存储执行任务过程中接收到的图像数据
  const [images, setImages] = createSignal<Uint8Array[]>([]);
  // 存储当前显示的执行任务过程中的图像索引
  const [currentImageIndex, setCurrentImageIndex] = createSignal(0);
  // 当前战斗状态
  const [battleState, setBattleState] = createSignal("");
  // 干员相关信息
  const [operInfos, setOperInfos] = createSignal<{ name: string, rect: { x: number, y: number, width: number, height: number }, available: boolean }[]>([]);
  // 分析战斗过程的状态
  const [battleAnalyzing, setBattleAnalyzing] = createSignal(false);

  createEffect(async () => {
    if (connected()) {
      updateScreen();
      setScreenUpdating(false);

      setTasks(await invoke("get_tasks"));
    }
  });
  createEffect(() => {
    if (images().length > 0) {
      drawImage(images()[currentImageIndex()]);
    }
  })
  const onConnect = async () => {
    if (serial().length > 0 && !connected()) {
      try {
        setConnecting(true);
        await invoke('connect', { serial: serial() })
        setConnected(true);
      } catch (err) {
        console.log(`connect failed: ${err}`)
      } finally {
        setConnecting(false)
      }
    }
  }

  // 将 imageData 绘制在 canvas 上
  const drawImage = async (imageData: Uint8Array) => {
    const ctx = canvas!.getContext("bitmaprenderer");
    const blob = new Blob([imageData], { type: "image/png" });
    const bitmap = await createImageBitmap(blob);
    ctx?.transferFromImageBitmap(bitmap);
  }

  const updateScreen = async () => {
    console.time("get_screen")
    setScreenUpdating(true);
    const imageData: Uint8Array = new Uint8Array(await invoke("get_screen"));
    console.timeEnd("get_screen")
    drawImage(imageData);
    setScreenUpdating(false);
  }

  // 监听后端发来的日志信息
  let unlistenLog: UnlistenFn | null;
  // 监听后端发来的图片信息
  let UnlistenImage: UnlistenFn | null;

  // 后端发的战斗状态
  let unlistenBattleState: UnlistenFn | null;
  // 后端发的干员名
  let unlistenOperName: UnlistenFn | null;
  // 后端发的干员位置信息
  let unlistenOperRect: UnlistenFn | null;
  // 侯丹发的干员状态信息
  let unlistenOperAvai: UnlistenFn | null;
  onMount(async () => {
    // 在前端 Card 显示日志信息
    unlistenLog = await listen<string>('log_event', (event) => {
      setLog((prevLog) => [...prevLog, event.payload]);
    })
    // 在前端 canvas 显示图片
    UnlistenImage = await listen<any>('image_event', (event) => {
      const imageData: Uint8Array = new Uint8Array(event.payload);
      setImages((prevImages) => [...prevImages, imageData]);
      // 显示新添加的图像
      setCurrentImageIndex(images().length - 1);
    })

    // 接收战斗状态信息
    unlistenBattleState = await listen('battleState', (event) => {
      setBattleState(event.payload);
    })

    // 接收干员名信息
    unlistenOperName = await listen<string>('oper_name', (event) => {
      const oper_name = event.payload;
      setOperInfos((prevInfos) => {
        const newInfos = [...prevInfos];
        newInfos[newInfos.length - 1].name = oper_name;
        return newInfos;
      });
    })

    // 接收干员位置信息
    unlistenOperRect = await listen<{ x: number, y: number, width: number, height: number }>('rect', (event) => {
      const rect = event.payload;
      setOperInfos((prevInfos) => {
        const newInfos = [...prevInfos];
        newInfos[newInfos.length - 1].rect = rect;
        return newInfos;
      })
    })

    // 接收干员状态信息
    unlistenOperAvai = await listen<boolean>('available', (event) => {
      const available = event.payload;
      setOperInfos((prevInfos) => {
        const newInfos = [...prevInfos];
        newInfos[newInfos.length - 1].available = available;
        return newInfos;
      });
    })

  })

  // 清理监听器
  onCleanup(() => {
    if (unlistenLog) {
      unlistenLog();
    }
    if (UnlistenImage) {
      UnlistenImage();
    }
    if (unlistenBattleState) {
      unlistenBattleState();
    }
    if (unlistenOperName) {
      unlistenOperName();
    }
    if (unlistenOperRect) {
      unlistenOperRect();
    }
    if (unlistenOperAvai) {
      unlistenOperAvai();
    }
  })

  // 获得分析部署后的结果
  async function getAnalyzeResult() {
    const imageData: Uint8Array = new Uint8Array(await invoke("get_deploy_analyze_result"));
    drawImage(imageData);
  }

  const ConnectView = () => <>
    <div class="flex gap-4 w-full justify-center items-center">
      <TextField
        label="序列号"
        variant="outlined"
        value={serial()}
        onChange={(e, v) => {
          setSerial(v);
        }}
      />
      <Button variant="contained" onClick={onConnect} disabled={connecting()}>建立连接</Button>
    </div>
  </>

  const onRunTask = async (task: string) => {
    setCurrentTask(task);
    setLog([]);
    setImages([]);
    await invoke("run_task", { name: task });
  }

  // 当前显示的页面
  const [mainSelected, setMainSelected] = createSignal(true);
  const [battleAnalyzeSelected, setBattleAnalyzeSelected] = createSignal(false);

  // 主页面
  const MainView = () => <>
    <div class="flex-1 flex w-full max-h-full box-border gap-4">
      {/* Screen part */}
      <Card class="flex-1 flex flex-col gap-2 h-full items-center justify-stretch">
        <div class="flex items-center justify-between border-box ml-2 mr-2">
          <span>Screen</span>

          <Show when={screenUpdating()} fallback={<IconButton onClick={updateScreen}>
            <Refresh />
          </IconButton>}>
            <CircularProgress color="inherit" />
          </Show>
        </div>
        <canvas ref={canvas} class="w-full" />
        <Show when={images().length > 0} fallback={<></>}>
          <div>
            <Button variant="outlined" onClick={() => setCurrentImageIndex((i) => Math.max(i - 1, 0))}>上一张</Button>
            <Button variant="outlined" onClick={() => setCurrentImageIndex((i) => Math.min(i + 1, images().length - 1))}>下一张</Button>
          </div>
        </Show>

        {/* 打印执行信息的地方 */}
        <Card class="w-11/12 pl-4 h-full m-2 flex-1 flex">
          <div class="overflow-y-auto w-full">
            <span>任务执行情况：</span>
            <div>正在执行的任务是：{currentTask()}</div>
            <code>
              <For each={log()}>{(logItem) => <div>{logItem}</div>}</For>
            </code>
          </div>
        </Card>
      </Card>
      {/* Right part */}
      <div class="h-full flex flex-col gap-4">
        <Card class="flex flex-col p-2">
          <div class="mb-4 flex items-center justify-between">
            <span>Tasks</span>
            <Show when={taskUpdating()} fallback={<IconButton onClick={async () => {
              setTaskUpdating(true);
              await invoke("reload_resources");
              setTasks(await invoke("get_tasks"));
              setTaskUpdating(false);
            }}>
              <Refresh />
            </IconButton>}>
              <CircularProgress color="inherit" />
            </Show>
          </div>
          <div class="flex flex-col overflow-y-auto gap-2 min-w-60">
            <For each={tasks()}>
              {(task) => (
                <div class="flex justify-between items-center">
                  <span>{task}</span>
                  <Button variant="contained" onClick={() => { onRunTask(task) }}>执行任务</Button>
                </div>
              )}
            </For>
          </div>
        </Card>
        <Card class="p-4 flex flex-none gap-24 items-center">
          <span>Analyzers</span>
          <Button variant="contained" onClick={getAnalyzeResult}>分析部署</Button>
        </Card>
      </div>
    </div>
  </>
  // 战斗分析页面
  const BattleAnalyzeView = () => <>
    <Card>
      <Button variant="contained" onClick={async () => {
        setBattleAnalyzing(true);
        await invoke("start_battle_analyzer");
        setBattleAnalyzing(false);
      }} disabled={battleAnalyzing()}>Rock and Roll!</Button>

      <div>当前战斗状态：{battleState()}</div>
      <div>当前干员状态：</div>
      <For each={operInfos()}>
        {(operInfo) => (
          <div>干员名称：{operInfo.name} 干员位置：({operInfo.rect.x}, {operInfo.rect.y}, {operInfo.rect.width}, {operInfo.rect.height})
          干员状态：{operInfo.available?"可用":"不可用"}
          </div>
        )}
      </For>
      
    </Card>
  </>

  return (
    <div class="flex flex-col w-full h-full max-h-full items-center p-4 box-border overflow-hidden">
      <Show when={connected()} fallback={<ConnectView />}>
        <AppBar position="static">
          <Toolbar>
            <Button color="inherit" onClick={() => {
              setMainSelected(true);
              setBattleAnalyzeSelected(false);
            }}>主页面</Button>
            <Button color="inherit" onClick={() => {
              setBattleAnalyzeSelected(true);
              setMainSelected(false);
            }}>战斗分析页面</Button>
          </Toolbar>
        </AppBar>
        <Show when={mainSelected()} fallback={<BattleAnalyzeView />}>
          <MainView />
        </Show>
      </Show>
    </div>




    // <div class="flex flex-col w-full h-full max-h-full items-center p-4 box-border overflow-hidden">
    //   <Show when={connected()} fallback={<ConnectView />}>
    //     <div class="flex-1 flex w-full max-h-full box-border gap-4">
    //       {/* Screen part */}
    //       <Card class="flex-1 flex flex-col gap-2 h-full items-center justify-stretch">
    //         <div class="flex items-center justify-between border-box ml-2 mr-2">
    //           <span>Screen</span>

    //           <Show when={screenUpdating()} fallback={<IconButton onClick={updateScreen}>
    //             <Refresh />
    //           </IconButton>}>
    //             <CircularProgress color="inherit" />
    //           </Show>

    //         </div>
    //         <canvas ref={canvas} class="w-full" />
    //         <Show when={images().length > 0} fallback={<></>}>
    //           <div>
    //             <Button variant="outlined" onClick={() => setCurrentImageIndex((i) => Math.max(i - 1, 0))}>上一张</Button>
    //             <Button variant="outlined" onClick={() => setCurrentImageIndex((i) => Math.min(i + 1, images().length - 1))}>下一张</Button>
    //           </div>
    //         </Show>

    //         {/* 打印执行信息的地方 */}
    //         <Card class="w-11/12 pl-4 h-full m-2 flex-1 flex">
    //           <div class="overflow-y-auto w-full">
    //             <span>任务执行情况：</span>
    //             <div>正在执行的任务是：{currentTask()}</div>
    //             <code>
    //               <For each={log()}>{(logItem) => <div>{logItem}</div>}</For>
    //             </code>
    //           </div>
    //         </Card>
    //       </Card>
    //       {/* Right part */}
    //       <div class="h-full flex flex-col gap-4">
    //         <Card class="flex flex-col p-2">
    //           <div class="mb-4 flex items-center justify-between">
    //             <span>Tasks</span>
    //             <Show when={taskUpdating()} fallback={<IconButton onClick={async () => {
    //               setTaskUpdating(true);
    //               await invoke("reload_resources");
    //               setTasks(await invoke("get_tasks"));
    //               setTaskUpdating(false);
    //             }}>
    //               <Refresh />
    //             </IconButton>}>
    //               <CircularProgress color="inherit" />
    //             </Show>
    //           </div>
    //           <div class="flex flex-col overflow-y-auto gap-2 min-w-60">
    //             <For each={tasks()}>
    //               {(task) => (
    //                 <div class="flex justify-between items-center">
    //                   <span>{task}</span>
    //                   <Button variant="contained" onClick={() => { onRunTask(task) }}>执行任务</Button>
    //                 </div>
    //               )}
    //             </For>
    //           </div>
    //         </Card>
    //         <Card class="p-4 flex flex-none gap-24 items-center">
    //           <span>Analyzers</span>
    //           <Button variant="contained" onClick={getAnalyzeResult}>分析部署</Button>
    //         </Card>
    //       </div>
    //     </div>
    //   </Show>
    // </div>
  );
}

export default App;
