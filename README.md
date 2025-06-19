## RoadWatch - 도로시설물 훼손 탐지 시스템.

아직 개발중, 진행상황 체크를 위해 확인하고 싶다면 아래 install 과정을 통해 실행해볼 수 있습니다.

install 
1. git clone 후 디렉토리에서 npm dev run을 실행하여 url 복사 후 종료.
2. Kakao Developers에 로그인
3. 내 애플리케이션>애플리케이션 추가를 통해 아무 애플리케이션이나 생성.
4. 해당 애플리케이션을 클릭하여 앱 설정으로 이동
5. 왼쪽의 앱 설정>앱 키 에서 javascript 키를 복사.
6. 앱 설정>플랫폼 에서 Web 도메인 주소에 1번에서의 url 추가.
7. 앱 설정>카카오맵 에서 카카오맵 api 활성화.
8. src/page.tsx의  script.src 부분의 appkey={여기에 javascript 키 복사}&~~~~
9. 다시 npm dev run 하면 웹에서 UI 확인 가능.
   


행정구역 단위로 구분하여, 탐지된 훼손시설물이 지도에 마커로 표시됨.
훼손 탐지 신뢰도(confidence)가 50 이상이면 훼손 확실, 이하면 확인필요


![image](https://github.com/user-attachments/assets/3be0bb6e-0ed7-43a6-91c2-1d17046e7742)


스크롤을 통해 지도를 확대할 수 있고, 지도 확대 시 상세 GPS 정보가 지도에 표시됨.


![image](https://github.com/user-attachments/assets/251bc2d0-69ef-4152-9490-3d5e8359b509)


마커 클릭 시, 해당 위치의 시설물에 대한 상세정보를 확인하고 훼손 등급을 분류할 수 있는 모달창이 표시됨.

![image](https://github.com/user-attachments/assets/11fee4b0-90e9-4ab3-920e-8f4854295e80)


마커를 클릭하여 확인한 시설물은 투명하게 처리됨

![image](https://github.com/user-attachments/assets/dee01db6-b4b8-4411-8eeb-852e875a423a)


오른쪽 위 탐지결과 상세보기 클릭 시, 탐지된 훼손 시설물들의 리스트를 보여줌.
리스트는 가장 훼손이 큰 시설물들부터 내림차순으로 정렬되어 도로관리자에게 보여짐.

![image](https://github.com/user-attachments/assets/9da77aa5-17af-4aba-b2a5-7c1fb751cfa0)


리스트에는 해당 관할구역에서의 훼손 탐지결과가, 각 시설물마다 카드 형태로 표시됨.
이미지를 클릭할 시 확대된 이미지로 해당 시설물을 확인할 수 있음.


![image](https://github.com/user-attachments/assets/943e2e5b-4a7b-4755-a9c2-4d4237a5c061)

지자체 도로관리자가 해당 시설물 이미지를 확인하고, 옳지 않게 분류된 훼손시설물들은 다시 드롭다운 메뉴로 재분류하면, 해당 결과가 DB에 반영.

결과 다운로드 버튼을 통해 CSV 파일로 저장됨.
