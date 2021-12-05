/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { observer } from "mobx-react";
import React from "react";
import { dot } from "../../api";
import { Urlbar } from "../../core/urlbar";
import { openMenuAt } from "../../shared/menu";
import { NewTabButton } from "../NewTabButton";
import { Spring } from "../Spring";
import { Tabs } from "../Tabs";
import { ToolbarButton } from "../ToolbarButton";
import { WindowControls } from "../WindowControls";

export const Chrome = observer(() => {
    if (dot.tabs.selectedTab) {
        return (
            <div
                id={"navigator-toolbox"}
                onContextMenu={(e) =>
                    openMenuAt({
                        name: "WindowMenu",
                        bounds: [e.clientX, e.clientY],
                        ctx: {}
                    })
                }
            >
                <nav id={"navigation-bar"}>
                    <div id={"navigation-bar-container"}>
                        <ToolbarButton
                            image={
                                "chrome://dot/content/skin/icons/back.svg"
                            }
                            disabled={
                                !dot.tabs.selectedTab
                                    ?.canGoBack
                            }
                            command={"Browser:GoBack"}
                        />

                        <ToolbarButton
                            image={
                                "chrome://dot/content/skin/icons/forward.svg"
                            }
                            disabled={
                                !dot.tabs.selectedTab
                                    ?.canGoForward
                            }
                            command={
                                "Browser:GoForward"
                            }
                        />

                        <ToolbarButton
                            image={
                                dot.tabs.selectedTab
                                    ?.state ==
                                    "loading" &&
                                !dot.tabs.selectedTab
                                    ?.identityManager
                                    .isAboutUI
                                    ? "chrome://dot/content/skin/icons/close.svg"
                                    : "chrome://dot/content/skin/icons/reload.svg"
                            }
                            command={
                                dot.tabs.selectedTab
                                    ?.state ==
                                    "idle" ||
                                dot.tabs.selectedTab
                                    ?.identityManager
                                    .isAboutUI
                                    ? "Browser:Reload"
                                    : "Browser:Stop"
                            }
                        />

                        <Spring />
                        <Urlbar
                            tab={dot.tabs.selectedTab}
                        />
                        <Spring />

                        <ToolbarButton
                            image={
                                "chrome://dot/content/skin/icons/inspect.svg"
                            }
                            command={
                                "Browser:LaunchBrowserToolbox"
                            }
                        />

                        <ToolbarButton
                            image={
                                "chrome://dot/content/skin/icons/settings.svg"
                            }
                            command={
                                "Browser:OpenPreferences"
                            }
                        />

                        <ToolbarButton
                            id={"application-menu-button"}
                            image={
                                "chrome://dot/content/skin/icons/more.svg"
                            }
                            menu={"AppMenu"}
                        />
                    </div>
                    <WindowControls />
                </nav>
                <nav id={"tab-bar"}>
                    <Tabs />

                    <NewTabButton />
                </nav>

                {/* <Browser src={"https://google.com"} /> */}
            </div>
        );
    } else {
        return <></>;
    }
});
