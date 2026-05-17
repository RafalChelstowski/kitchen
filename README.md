# Kitchen

https://kitchen.vercel.app

## About

Main goal of the project was to strenghten my skills with react, three.js, react-three-fiber ecosystem and blender.

## Goals

- player is able to move and interact with the enviroment;
- there are hidden tasks - "achievements", that are unlocked through some interactions;
- some interactions unlock other interactions;
- I did not want to make interaction obvious - no "witcher senses", it is moderately difficult to find all achievements;
- player progress is saved locally in the browser;

## Model

Source room is a kitchen/cafeteria located in [TouK](https://touk.pl) offices in Warsaw.

![touk - 1](https://user-images.githubusercontent.com/58270768/179422119-2337e8a5-88e2-483a-92e1-c4e17bb90527.jpeg)
![touk - 2](https://user-images.githubusercontent.com/58270768/179422125-92563d25-4e00-4453-a513-33fda37c6683.jpeg)
![touk - 3](https://user-images.githubusercontent.com/58270768/179422126-9eef4620-6fbb-434c-aada-a4b1e24fb720.jpeg)

I took the 3D scan of the room and surroundings using [3D Scanner](https://apps.apple.com/us/app/3d-scanner-app/id1419913995) app (it uses iPhone camera and lidar scanner, so the dimensions are close to the real life)

![touk - 1 (1)](https://user-images.githubusercontent.com/58270768/179422620-647adb45-e932-42c8-a9ee-3982f9a443a3.jpeg)
![touk - 2 (1)](https://user-images.githubusercontent.com/58270768/179422625-edf657c0-9801-4f40-89eb-68e3076ea771.jpeg)

Then I basically recreated everything in Blender and textured in Substance Designer. 
From Blender I've exported 4k baked textures with lights/shadows + normals/metallic/roughness. Then it was really easy to create scene with gltfjsx, moving interactive parts to separate components. 

![blender](https://user-images.githubusercontent.com/58270768/179422874-efe1aa86-cdeb-4532-ad69-35ac39c27377.jpg)


