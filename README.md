## RoadWatch - 도로시설물 훼손 탐지 시스템.




![Uploading image.png…]()


행정구역 단위로 구분하여, 탐지된 훼손시설물이 지도에 마커로 표시함.


![image](https://github.com/user-attachments/assets/87956807-8eda-4f82-a11e-b77a4d007dc8)

스크롤을 통해 지도를 확대할 수 있고, 지도 확대 시 상세 GPS 정보가 지도에 표시됨.


![image](https://github.com/user-attachments/assets/251bc2d0-69ef-4152-9490-3d5e8359b509)


해당 행정구역 클릭 시, 탐지된 훼손 시설물들의 리스트를 보여줌.
리스트는 가장 훼손이 큰 시설물들부터 내림차순으로 정렬되어 도로관리자에게 보여짐.

![image](https://github.com/user-attachments/assets/9da77aa5-17af-4aba-b2a5-7c1fb751cfa0)


리스트에는 시설물의 훼손 정도, 위치(GPS), 탐지된 시각, 시설물 종류, 해당 시설물 이미지가 있으며
이미지를 클릭할 시 확대된 이미지로 해당 시설물을 확인할 수 있음.


![image](https://github.com/user-attachments/assets/943e2e5b-4a7b-4755-a9c2-4d4237a5c061)

지자체 도로관리자가 해당 시설물 이미지를 확인하고, 옳지 않게 분류된 훼손시설물들은 다시 드롭다운 메뉴로 재분류하면, 해당 결과가 DB에 반영.

결과 다운로드 버튼을 통해 CSV 파일로 저장됨.
