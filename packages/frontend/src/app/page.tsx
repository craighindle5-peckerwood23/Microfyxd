"use client";
import { useState } from "react";
import { OSProvider, useOS } from "@/os/state/OSContext";
import BootExperience from "@/os/boot/BootExperience";
import OSShell from "@/os/shell/OSShell";

function Root() {
  const { booted, setBooted } = useOS();
  return (
    <>
      {!booted && <BootExperience onDone={() => setBooted(true)} />}
      <OSShell />
    </>
  );
}

export default function MicrofyxdOS() {
  return (
    <OSProvider>
      <Root />
    </OSProvider>
  );
}
