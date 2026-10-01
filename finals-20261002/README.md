# ITDA 본선 발표

11장 발표 화면과 슬라이드별 대본입니다. 기존 저장소의 모바일 데모는 변경하지 않습니다.

## 실행

```bash
python -m pip install -r finals-20261002/requirements.txt
python -m streamlit run finals-20261002/streamlit_app.py
```

Streamlit Community Cloud에서는 저장소 `hyeminhassomething/itda-pharmacy-demo`, 브랜치 `main`, 실행 파일 `finals-20261002/streamlit_app.py`를 선택합니다. Python 3.12를 사용할 수 있습니다. 별도 API 키나 OCR 모델은 필요하지 않습니다.

## 파일

- `index.html`: 발표 화면
- `index.template.html`: 발표 화면 템플릿. 문구 변경 후 `node finals-20261002/build_delivery.mjs`로 HTML과 대본을 갱신합니다.
- `presentation.css`, `presentation.js`: 레이아웃·탐색·단계별 애니메이션
- `slides.json`: 화면 문구, 대본, 시간 배분, 자료 출처의 원본
- `발표대본.md`: 슬라이드 순서대로 읽는 대본
- `발표_오프라인.html`: 인터넷 없이 여는 단일 HTML
- `streamlit_app.py`: Streamlit 실행 파일

HTML 화면 조작법은 화면의 도움말에서 확인할 수 있습니다. 발표자 노트와 근거는 보조 보기에서 열고, 투사 화면에서는 닫아 둡니다. 노트는 비밀 저장 공간이 아니라 같은 공개 발표 자료의 일부입니다.

## 발표 범위

제공된 `[CODE]_테러범_본선발표.pdf`의 표지와 01~10 순서를 유지했습니다. 문제 정의, OCR, 전산화, 회수 수량 범위, 반품 조건과 판매 시나리오, 운영을 다룹니다.

09번 애니메이션은 가상 입력으로 연결 흐름을 설명합니다. 실제 OCR·ERP·회수 공공데이터 API를 실행하지 않으며 실제 반품 가능 여부를 보증하지 않습니다. 원본 영상의 미판독 결과를 성공 결과로 바꾸지 않았습니다. 실제 모델 성능은 모델 버전·표본·조건이 확인된 결과만 별도 반영해야 합니다.

현재 자료에서 확정되지 않은 수치와 경제성 효과는 임의로 채우지 않았습니다. 빈 성능 그래프는 구조와 평가 범위 설명으로 대체했습니다. 부분 날짜는 보존하되 업무 마감일을 추정하지 않고, 실제 규칙과 거래의 확인이 부족하면 보류하는 방향을 따릅니다.

## 대본 노션

[슬라이드 캡처와 대본](https://app.notion.com/p/3ec30e37067481d18d43c591513397e3)

노션에는 원본 캡처와 교정 대본, 화면 수정 메모가 있습니다. 발표용 HTML은 확인된 교정을 반영합니다. 약 9분의 시간 배분은 리허설 계획이며 측정된 발화 시간이 아닙니다.
