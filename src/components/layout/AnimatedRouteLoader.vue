<template>
  <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
    <rect x="8" y="9" width="64" height="62" rx="15" fill="currentColor" opacity=".08" />
    <rect
      x="8"
      y="9"
      width="64"
      height="62"
      rx="15"
      stroke="currentColor"
      stroke-width="2"
      opacity=".55"
    />
    <path
      d="M9 27h62M34 18h24"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      opacity=".4"
    />
    <circle cx="19" cy="18" r="2" fill="currentColor" />
    <circle cx="26" cy="18" r="2" fill="currentColor" opacity=".45" />
    <rect x="17" y="35" width="29" height="27" rx="5" fill="currentColor" opacity=".12" />
    <g fill="currentColor">
      <rect class="bar" x="22" y="47" width="4" height="10" rx="2" />
      <rect class="bar bar-middle" x="29.5" y="42" width="4" height="15" rx="2" />
      <rect class="bar bar-last" x="37" y="39" width="4" height="18" rx="2" />
      <rect class="tile" x="51" y="35" width="12" height="11" rx="3" />
      <rect class="tile tile-last" x="51" y="51" width="12" height="11" rx="3" />
    </g>
  </svg>
</template>

<style scoped>
.bar {
  transform-box: fill-box;
  transform-origin: center bottom;
  animation: chart-bar 1.35s ease-in-out infinite;
}

.bar-middle {
  animation-delay: -0.18s;
}

.bar-last {
  animation-delay: -0.36s;
}

.tile {
  opacity: 0.45;
  animation: panel-tile 1.35s ease-in-out infinite;
}

.tile-last {
  animation-delay: -0.675s;
}

@keyframes chart-bar {
  0%,
  100% {
    transform: scaleY(0.55);
  }
  50% {
    transform: scaleY(1);
  }
}

@keyframes panel-tile {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.72;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar,
  .tile {
    animation: none;
  }
}
</style>
