import { Component, createEffect, createSignal, For, onMount, onCleanup, Show } from "solid-js";
import { Card, IconButton, Button, CircularProgress } from "@suid/material";
import { Refresh } from "@suid/icons-material";
import { invoke } from "@tauri-apps/api/core";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

const CopilotPage: Component = () => {
  // copilot 列表
  const [copilots, setCopilots] = createSignal<string[]>([]);
  // 当前正在执行的 copilot
  const [currentCopilot, setCurrentCopilot] = createSignal("");
  // 执行 copilot 情况的日志信息
  const [log, setLog] = createSignal<string[]>([]);
  // 是否正在执行copilot
  const [running, setRunning] = createSignal(false);
  // 更新 copilot 状态
  const [copilotUpdating, setCopilotUpdating] = createSignal(false);

  // 监听后端发来的日志信息
  let unlistenLog: UnlistenFn | null;
  let logContainerRef: HTMLDivElement | undefined;

  onMount(async () => {
    // 在前端 Card 显示日志信息
    unlistenLog = await listen<string>('log_event', (event) => {
      setLog((prevLog) => [...prevLog, event.payload]);
    })
  })

  // 清理监听器
  onCleanup(() => {
    if (unlistenLog) {
      unlistenLog();
    }
  })

  // 加载 copilot 列表
  createEffect(async () => {
    setCopilots(await invoke("get_copilots"));
  })

  // 滚动到最下方
  createEffect(() => {
    if (logContainerRef) {
      logContainerRef.scrollTop = logContainerRef.scrollHeight;
    }
  });

  // 运行 copilot 时执行的函数
  const onRunCopilot = async (copilot: string) => {
    setCurrentCopilot(copilot);
    setRunning(true);
    setLog([]);
    try {
      await invoke("run_copilot", { name: copilot });
    } finally {
      setRunning(false);
    }
  }

  return <>
    <div class="flex flex-1 w-full box-border gap-4 overflow-y-auto">
      <Card class="flex flex-1 ">
        <div class="overflow-y-auto w-full ml-2 mt-2" ref={logContainerRef}>
          <span>
            Copilot执行情况：
          </span>
          <div>正在执行的Copilot是：{currentCopilot()}</div>
          <code>
            <For each={log()}>{(logItem) => <div>{logItem}</div>}</For>
          </code>
        </div>
      </Card>

      <Card class="flex flex-1 flex-col">
        <div class="ml-2 flex items-center">
          <span>Copilots</span>
          <Show when={copilotUpdating()} fallback={<IconButton onClick={async () => {
            setCopilotUpdating(true);
            await invoke("reload_resources");
            setCopilots(await invoke("get_copilots"));
            setCopilotUpdating(false);
          }}>
            <Refresh />
          </IconButton>}>
            <CircularProgress color="inherit" />
          </Show>
        </div>
        <div class="flex flex-col overflow-y-auto gap-2 min-w-60 ml-2 mr-2">
          <For each={copilots()}>
            {(copilot) => (
              <div class="flex justify-between items-center">
                <span>{copilot}</span>
                <Button class="mr-2" variant="contained" onClick={() => { onRunCopilot(copilot) }} disabled={running()}>执行copilot</Button>
              </div>
            )}
          </For>
        </div>
      </Card>
    </div>
  </>
}

export default CopilotPage;