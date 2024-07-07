import { useMatch, useNavigate } from "@solidjs/router";
import { Button } from "@suid/material";
import { Component, For } from "solid-js";

const Tab: Component<{ label: string, path: string }> = (props) => {
  const match = useMatch(() => props.path);
  const navigate = useNavigate();

  return <>
    <Button variant={match() ? "contained" : 'outlined'} onClick={() => {
      navigate(props.path);
    }}>{props.label}</Button>
  </>
}

const TabBar: Component = () => {
  const tabs = [
    { label: 'Main', path: '/' },
    { label: 'Battle', path: '/battle' },
  ]

  return <>
    <div class="flex align-center gap-2 w-full">
      <For each={tabs}>
        {tab => <Tab label={tab.label} path={tab.path} />}
      </For>
    </div>
  </>
}

export default TabBar;