import Docker from "dockerode";
import {
    readFileSync,
    writeFileSync
} from "fs";
import { resolve } from "path";
import { bin_name, log } from "..";
import {
    BUILD_TARGETS,
    CONFIGS_DIR,
    SRC_DIR
} from "../constants";
import { dispatch } from "../utils";

const platform: any = {
    win32: "windows",
    darwin: "macos",
    linux: "linux"
};

const applyConfig = (os: string) => {
    log.info("Applying mozconfig...");
    const commonConfig = readFileSync(
        resolve(
            CONFIGS_DIR,
            "common",
            "mozconfig"
        ),
        "utf-8"
    );
    const osConfig = readFileSync(
        resolve(CONFIGS_DIR, os, "mozconfig"),
        "utf-8"
    );
    const mergedConfig = `# This file is automatically generated. Do not edit!\n\n${commonConfig}\n\n${osConfig}`;

    writeFileSync(
        resolve(SRC_DIR, "mozconfig"),
        mergedConfig
    );

    log.info(
        `Config for this \`${os}\` build:`
    );

    mergedConfig.split("\n").map((ln) => {
        if (
            ln.startsWith("mk") ||
            ln.startsWith("ac")
        )
            log.info(
                `\t${
                    ln.split("add_options ")[1]
                }`
            );
    });
};

const dockerBuild = async (os: string) => {
    const dockerfile = `configs/${os}/${os}.dockerfile`;
    const image_name = `db-${os}-build`;

    log.info(
        `Building Dockerfile for "${os}"...`
    );
    await dispatch("docker", [
        "build",
        `configs/${os}`,
        "-f",
        dockerfile,
        "-t",
        image_name
    ]);

    const docker = new Docker();

    const container = await docker.createContainer(
        {
            Image: image_name,
            Tty: true,
            Volumes: {
                "/worker": {},
                "/worker/build": {}
            },
            HostConfig: {
                Binds: [
                    `${SRC_DIR}:/worker/build`,
                    `${resolve(
                        process.cwd()
                    )}:/worker`
                ]
            }
        }
    );

    container.attach(
        {
            stream: true,
            stdin: true,
            stdout: true,
            stderr: true
        },
        (e, out) => {
            if (out) out.pipe(process.stdout);
        }
    );

    await container.start();
    await container.wait();
};

const genericBuild = async (os: string) => {
    log.info(`Building for "${os}"...`);

    log.warning(
        `If you get any dependency errors, try running |${bin_name} bootstrap|.`
    );

    await dispatch(
        `./mach`,
        ["build"],
        SRC_DIR
    );
};

const parseDate = (d: number) => {
    d = d / 1000;
    var h = Math.floor(d / 3600);
    var m = Math.floor((d % 3600) / 60);
    var s = Math.floor((d % 3600) % 60);

    var hDisplay =
        h > 0
            ? h +
              (h == 1 ? " hour, " : " hours, ")
            : "";
    var mDisplay =
        m > 0
            ? m +
              (m == 1
                  ? " minute, "
                  : " minutes, ")
            : "";
    var sDisplay =
        s > 0
            ? s +
              (s == 1 ? " second" : " seconds")
            : "";
    return hDisplay + mDisplay + sDisplay;
};

const success = (date: number) => {
    // mach handles the success messages
    console.log();
    log.info(
        `Total build time: ${parseDate(
            Date.now() - date
        )}.`
    );
};

export const build = async (os: string) => {
    let d = Date.now();

    if (os) {
        // Docker build

        if (!BUILD_TARGETS.includes(os))
            return log.error(
                `We do not support "${os}" builds right now.\nWe only currently support ${JSON.stringify(
                    BUILD_TARGETS
                )}.`
            );

        applyConfig(os);

        setTimeout(async () => {
            await dockerBuild(os).then((_) =>
                success(d)
            );
        }, 2500);
    } else {
        // Host build

        const prettyHost =
            platform[process.platform as any];

        if (
            BUILD_TARGETS.includes(prettyHost)
        ) {
            applyConfig(prettyHost);

            setTimeout(async () => {
                await genericBuild(
                    prettyHost
                ).then((_) => success(d));
            }, 2500);
        } else {
            return log.error(
                `We do not support "${prettyHost}" builds right now.\nWe only currently support ${JSON.stringify(
                    BUILD_TARGETS
                )}.`
            );
        }
    }
};
