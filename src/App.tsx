import { createSignal, For, createEffect, onMount, onCleanup, Show, Component, createContext, useContext, Switch, Match } from "solid-js";
import { UnlistenFn, emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { TextField, Button, IconButton, Card, CircularProgress, AppBar, Toolbar } from "@suid/material";
import "./App.css";
import { Refresh } from "@suid/icons-material";
import { event } from "@tauri-apps/api";
import { Route, Router, RouteSectionProps } from "@solidjs/router";
import { createStore } from "solid-js/store";
import BattlePage from "./pages/Battle";
import MainPage from "./pages/Main";
import TabBar from "./components/TabBar";

const Root: Component<RouteSectionProps> = (props) => {
  const [connected, setConnected] = createSignal(false);

  onMount(async () => {
    try{
      setConnected(await invoke('get_connected'))
    } catch(e) {
      console.log(e)
    }
  })

  const ConnectView = () => {
    const [serial, setSerial] = createSignal("127.0.0.1:16384")
    const [connecting, setConnecting] = createSignal(false);
    const [disconnecting, setDisConnecting] = createSignal(false);

    const onConnect = async () => {
      setConnecting(true);
      try {
        await invoke('connect', { serial: serial() })
      } finally {
        setConnecting(false);
      }
      setConnected(true);
    }

    const onDisconnect = async () => {
      setDisConnecting(true)
      try {
        await invoke('disconnect')
      } finally {
        setDisConnecting(false)
      }
      setConnected(false);
    }

    return <>
      <div class="flex gap-4 w-full justify-center items-center">
        <TextField
          label="序列号"
          variant="outlined"
          value={serial()}
          onChange={(_, v) => {
            setSerial(v);
          }}
          disabled={connected()}
        />
        <Switch>
          <Match when={!connected()}>
            <Button variant="contained" onClick={onConnect} disabled={connecting() || connected()}>建立连接</Button>
          </Match>
          <Match when={connected()}>
            <Button variant="contained" onClick={onDisconnect} disabled={disconnecting()} color="error">断开连接</Button>
          </Match>
        </Switch>
      </div>
    </>
  }

  return <>
    <div class="flex flex-col w-full h-full max-h-full items-center p-4 box-border overflow-hidden">
      <ConnectView />
      <Show when={connected()}>
        <TabBar />
        {props.children}
      </Show>
    </div>
  </>
}

const App: Component = () => {
  return <>
    <Router root={Root}>
      <Route path="/" component={MainPage} />
      <Route path="/battle" component={BattlePage} />
    </Router>
  </>
}

export default App;