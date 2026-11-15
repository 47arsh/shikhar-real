const pines: Array<[number, number, number]> = [
  [52, 706, 74],
  [104, 712, 52],
  [150, 700, 64],
  [1206, 700, 58],
  [1252, 710, 44],
  [1310, 702, 66],
  [1362, 714, 48],
  [330, 676, 26],
  [1080, 668, 22],
]

export function LandingScene() {
  return (
    <div className="landing-scene" aria-hidden="true">
      <svg
        className="scene-ridges"
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          d="M0 455 L90 402 Q120 380 150 402 L240 350 Q255 340 272 352 L360 300 Q380 288 400 302 L500 372 Q520 388 545 374 L640 318 Q660 305 682 320 L780 388 Q800 404 822 390 L905 344 Q925 330 948 346 L1040 402 Q1060 418 1084 404 L1175 352 Q1196 340 1218 356 L1300 408 Q1320 424 1342 410 L1440 372 L1440 720 L0 720 Z"
          fill="#cfd9cd"
        />
        <g fill="#f7f0e3" opacity="0.92">
          <path d="M360 300 L384 338 L372 330 L360 344 L346 332 L338 336 Z" />
          <path d="M640 318 L662 352 L650 344 L638 356 L626 344 L618 348 Z" />
          <path d="M905 344 L925 376 L914 368 L903 379 L893 368 L885 372 Z" />
          <path d="M1175 352 L1197 386 L1185 378 L1173 390 L1161 378 L1153 382 Z" />
        </g>

        <path
          d="M0 540 L110 470 Q140 448 170 470 L285 528 Q305 542 328 528 L420 442 Q442 424 464 444 L570 540 Q590 558 614 540 L700 470 Q722 452 744 472 L850 556 Q872 574 896 556 L985 476 Q1006 458 1028 478 L1130 560 Q1152 578 1176 560 L1270 486 Q1292 468 1314 488 L1440 560 L1440 720 L0 720 Z"
          fill="#8ea695"
        />
        <path
          d="M420 442 L440 470 L428 462 L416 474 L404 464 L396 468 Z"
          fill="#f4ecdd"
          opacity="0.75"
        />
        <path
          d="M985 476 L1004 502 L992 494 L980 506 L968 496 L960 500 Z"
          fill="#f4ecdd"
          opacity="0.7"
        />

        <path
          d="M0 635 L140 540 Q170 516 200 540 L320 630 Q342 648 366 632 L470 520 Q492 500 514 522 L620 620 Q642 638 666 620 L770 512 Q792 492 814 514 L920 616 Q942 634 966 616 L1070 528 Q1092 510 1114 530 L1215 620 Q1237 638 1261 620 L1350 548 Q1372 530 1394 550 L1440 585 L1440 720 L0 720 Z"
          fill="#2c5141"
        />
        <path
          d="M0 635 L140 540 Q170 516 200 540 L320 630 Q342 648 366 632 L470 520 Q492 500 514 522 L620 620 Q642 638 666 620 L770 512 Q792 492 814 514 L920 616 Q942 634 966 616 L1070 528 Q1092 510 1114 530 L1215 620 Q1237 638 1261 620 L1350 548 Q1372 530 1394 550 L1440 585"
          fill="none"
          stroke="#1d3a2e"
          strokeWidth="4"
          opacity="0.55"
        />

        <path
          d="M540 720 C590 674 636 646 680 606 Q724 566 756 526"
          fill="none"
          stroke="#f3ebdd"
          strokeWidth="2.4"
          strokeDasharray="3 9"
          strokeLinecap="round"
          opacity="0.6"
        />

        <g fill="#e9a23b">
          <path d="M636 646 L650 622 L664 646 Z" />
          <path d="M668 650 L679 630 L690 650 Z" opacity="0.85" />
        </g>

        <g transform="translate(770 510)">
          <line x1="0" y1="0" x2="0" y2="-26" stroke="#f3ebdd" strokeWidth="1.7" />
          <path d="M0 -26 L15 -21 L0 -15 Z" fill="#bf4535" />
          <circle cx="0" cy="-7" r="3.4" fill="#f3ebdd" />
          <path d="M-3.4 0 L0 -5.5 L3.4 0" stroke="#f3ebdd" strokeWidth="1.4" fill="none" />
        </g>

        <g fill="#132a22">
          {pines.map(([x, y, h]) => (
            <path key={`${x}-${y}`} d={`M${x} ${y} l${h * 0.5} ${-h} l${h * 0.5} ${h} Z`} />
          ))}
        </g>
      </svg>
    </div>
  )
}
