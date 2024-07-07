import { useMatch, useNavigate } from "@solidjs/router";
import { Button } from "@suid/material";
import { Component, For } from "solid-js";
import MainPage from "../pages/Main";
import BattlePage from "../pages/Battle";
import CopilotPage from "../pages/Copilot";

const Tab: Component<{ label: string, path: string }> = (props) => {
  const match = useMatch(() => props.path);
  const navigate = useNavigate();

  return <>
    <Button variant={match() ? "contained" : 'outlined'} onClick={() => {
      navigate(props.path);
    }}>{props.label}</Button>
  </>
}

export const tabs = [
  { label: 'Main', path: '/', component: MainPage },
  { label: 'Battle', path: '/battle', component: BattlePage },
  { label: 'Copilot', path: '/copilot', component: CopilotPage },
]

const TabBar: Component = () => {


  return <>
    <div class="flex align-center gap-2 w-full mt-2 mb-2">
      <For each={tabs}>
        {tab => <Tab label={tab.label} path={tab.path} />}
      </For>
    </div>
  </>
}

export default TabBar;