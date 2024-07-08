import { Chip, Popover } from "@suid/material";
import { Component, createSignal } from "solid-js";

export type DeployCardType = {
  oper_name: string,
  rect: {
    x: number,
    y: number,
    width: number,
    height: number,
  }
  available: boolean
}

const DeployCard: Component<{ data: DeployCardType }> = (props) => {
  const [anchorEl, setAnchorEl] = createSignal<Element | null>(null);

  const handlePopoverOpen = (event: { currentTarget: Element }) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = () => Boolean(anchorEl());

  return <>
    <Chip
      aria-owns={open() ? "mouse-over-popover" : undefined}
      aria-haspopup="true"
      onMouseEnter={handlePopoverOpen}
      onMouseLeave={handlePopoverClose}
      label={props.data.oper_name} variant={props.data.available ? "outlined" : "filled"}>
    </Chip>
    <Popover
      class="m-2"
      id="mouse-over-popover"
      sx={{ pointerEvents: "none" }}
      open={open()}
      anchorEl={anchorEl()}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
      onClose={handlePopoverClose}
      disableRestoreFocus
      elevation={2}
    >
      <div class="flex flex-col gap-2 m-2">
        <span>干员 ID: {props.data.oper_name}</span>
        <span>部署卡片位置: {`{x: ${props.data.rect.x}, y: ${props.data.rect.y}}`}</span>
        <span>就绪：{props.data.available ? "是" : "否"}</span>
      </div>
    </Popover>
  </>
}

export default DeployCard;