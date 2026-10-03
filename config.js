// 파일 경로는 index.html 기준입니다. null은 임시 화면을 표시합니다.
// 폴더에 파일을 넣은 뒤 아래 경로만 변경하면 됩니다.
window.APP_CONFIG = {
  timing: { blackHold: 500, fadeOut: 1000, placeholderVideo: 3000 },
  // 모든 화면은 9:16 세로 비율. cover = 꽉 채우기, contain = 전체 보이기.
  media: {
    image1: "gif/네이티.gif",
    homeCharacter: "image/네이티.png",
    video1: "video/시작 동영상.mp4", // 재생이 끝나면 자동으로 넘어갑니다.
    image2: "image/시작화면.png",
    image3: "image/그림1.png",
    image3Background: "image/그림1의 배경.jpg",
    image4: "image/기본화면.png", // 메인 배경
    image5: null, // 편지 버튼 이미지
    image6: null,
    image7: null,
    image8: null,
    startPressSound: "audio/button_press.mp3",
    letterOpenSound: "audio/book_opening.mp3",
  },
  audio: { introVideoVolume: 0.4 },
  // 메인 버튼에 표시할 문구. 왼쪽 번호는 이동할 섹션 번호입니다.
  menuLabels: {
    1: "Our Teenage",
    2: "Our Early 20s",
    3: "Us, now",
    4: "알고 계셨나요?",
    5: "Quiz",
  },
  // 곡을 추가하면 음악 선택 화면에 자동으로 추가됩니다.
  // cover에 자켓 이미지 경로를 지정하세요. 예: "image/music/자켓.jpg"
  // 가로·세로 이미지를 모두 중앙 기준 1:1 정사각형으로 자동 잘라 표시합니다.
  music: {
    defaultTrack: "kutsuzure",
    tracks: [


      { id: "usagi-rap-together", title: "Usagi Rap (Those With a Sense of Rhythm Version)", src: "audio/Usagi Rap (Those With a Sense of Rhythm Version).mp3", cover: "image/music/chiikawa movie.png", volume: 0.200 },
      { id: "kutsuzure", title: "Kutsuzure", src: "audio/Kutsuzure.mp3", cover: "image/music/chiikawa movie.png", volume: 0.200 },
      { id: "usagi-rap", title: "Usagi Rap (Solo Version)", src: "audio/Usagi Rap (Solo Version).mp3", cover: "image/music/chiikawa movie.png", volume: 0.200 },
      { id: "pajama-parties", title: "Pajama Parties no Uta", src: "audio/Pajama Parties no uta.mp3", cover: "image/music/pajama parties no uta.jpg", volume: 0.200 },
    ],
  },
  fits: { image2: "contain", image3: "contain", image4: "cover" },
  // 원본 이미지 기준 종이 윤곽. 종이 바깥은 클릭되지 않습니다.
  hotspot: {
    coordinateSpace: "image", x: 0, y: 0, width: 100, height: 100,
    clipPath: "polygon(0% 32.5%, 45.6% 0%, 55% 0%, 100% 39.5%, 100% 55.7%, 44.5% 88.5%)",
    showHint: false,
  },
  // 메뉴 번호: 1~3 사진첩 / 4 카드뉴스 / 5 퀴즈 / 봉투 편지.
  // 메뉴 이미지 image6, 7, 8은 각각 섹션 1, 2, 3의 버튼입니다.
  // 제목·카드·문항은 content.json에서 편집하세요.
};
