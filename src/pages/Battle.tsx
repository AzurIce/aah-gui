import { Component, createSignal, For, onMount, onCleanup } from "solid-js";
import { Button, Card } from "@suid/material";
import { invoke } from "@tauri-apps/api/core";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import DeployCard from "../components/DeployCard";
import { DeployCardType } from "../components/DeployCard";

const BattlePage: Component = () => {
  // 分析战斗过程的状态
  const [battleAnalyzing, setBattleAnalyzing] = createSignal(false);
  // 当前战斗状态
  const [battleState, setBattleState] = createSignal("");
  // 干员相关信息
  const [operInfos, setOperInfos] = createSignal<DeployCardType[]>([]);

  // 后端发的战斗状态
  let unlistenBattleState: UnlistenFn | null;
  // 后端发的干员信息
  let unlistenOperInfo: UnlistenFn | null;

  onMount(async () => {
    // 接收战斗状态信息
    unlistenBattleState = await listen('battleState', (event) => {
      console.log(event.payload)
      setBattleState(event.payload);
    })

    // 接收干员信息
    unlistenOperInfo = await listen<DeployCardType>('oper_info', (event) => {
      const oper_info = event.payload;
      setOperInfos((prevInfos) => [...prevInfos, oper_info]);
    })
  })

  // 清理监听器
  onCleanup(() => {
    if (unlistenBattleState) {
      unlistenBattleState();
    }
    if (unlistenOperInfo) {
      unlistenOperInfo();
    }
  })

  return <>
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
          <DeployCard data={operInfo} />
        )}
      </For>
    </Card>
  </>
}

export default BattlePage;