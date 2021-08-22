import React from "react"
import { store } from "../../app/store"
import { Tab } from "../../models/Tab"
import { hideFaviconFor } from "../../shared/tab"
import { ToolbarButton } from "../ToolbarButton"

export const BrowserTab = ({ tab, nextIsActive }: { tab: Tab, nextIsActive: boolean }) => {
    const [closing, setClosing] = React.useState(false);

    const onCloseClick = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        setClosing(true);

        tab.destroy();
    }

    return (
        <div
            className={"tabbrowser-tab"}
            data-active={tab.active}
            data-next-active={nextIsActive}
            data-closing={closing}
            onMouseDown={() => store.dispatch({ type: "TAB_SELECT", payload: tab.id })}
        >
            <div className={"tab-background"}></div>

            <div className={"tab-content"}>
                <i
                    className={"tab-icon-stack"}
                    data-icon-hidden={hideFaviconFor.includes(tab.url)}
                    style={{
                        backgroundImage: tab.state == "idle"
                            ? tab.faviconUrl ? `url(${tab.faviconUrl})` : ``
                            : `url(chrome://browser/skin/tabbrowser/tab-loading@2x.png)`
                    }}
                ></i>

                <span className={"tab-label-container"}>
                    <label className={"tab-text tab-label"}>{tab.title
                        ? tab.title
                        : tab.url == "about:blank" && tab.state == "loading"
                            ? "Loading…"
                            : tab.url}</label>
                </span>

                <ToolbarButton
                    className={"tab-close-button close-icon"}
                    image={"chrome://dot/content/skin/icons/close.svg"}
                    onMouseDown={(e: MouseEvent) => e.stopPropagation()}
                    onMouseUp={(e: MouseEvent) => onCloseClick(e)}
                />
            </div>
        </div>
    )
}