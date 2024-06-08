# Dash-Web

[![Node.js CI](https://github.com/ArnaudFlaesch/Dash-Web/actions/workflows/ci.yml/badge.svg)](https://github.com/ArnaudFlaesch/Dash-Web/actions/workflows/ci.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ArnaudFlaesch_Dash-Web&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=ArnaudFlaesch_Dash-Web)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ArnaudFlaesch_Dash-Web&metric=coverage)](https://sonarcloud.io/summary/new_code?id=ArnaudFlaesch_Dash-Web)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=ArnaudFlaesch_Dash-Web&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=ArnaudFlaesch_Dash-Web)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=ArnaudFlaesch_Dash-Web&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=ArnaudFlaesch_Dash-Web)
[![codecov](https://codecov.io/gh/ArnaudFlaesch/Dash-Web/branch/master/graph/badge.svg)](https://codecov.io/gh/ArnaudFlaesch/Dash-Web)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/d07fe5a81ce643de88b74717bb532791)](https://app.codacy.com/gh/ArnaudFlaesch/Dash-Web/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/d07fe5a81ce643de88b74717bb532791)](https://app.codacy.com/gh/ArnaudFlaesch/Dash-Web/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)
[![Known Vulnerabilities](https://snyk.io/test/github/ArnaudFlaesch/Dash-Web/badge.svg)](https://snyk.io/test/github/ArnaudFlaesch/Dash-Web)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)

## Description

L'application a pour but de proposer à un utilisateur de créer un dashboard sur
lequel il peut créer plusieurs widgets,
comme par exemple un lecteur de flux RSS, un calendrier listant des évènements à
partir d'un lien ICal et un affichage
de prévisions météorologiques. Il est possible de répartir ces widgets sur
plusieurs onglets.

Le projet est déployé via Github Pages et accessible à cette
addresse : <https://arnaudflaesch.github.io/Dash-Web/>.

## Démarrage

- Installation des dépendances

  > npm install

- Démarrage de l'application

  > npm start

L'application est ensuite accessible à l'addresse <http://localhost:4200>.

- Démarrage du backend

Il est nécessaire d'exécuter le backend et sa base de données pour que l'
application fonctionne.
Les sources et le README sont accessibles
ici : <https://github.com/ArnaudFlaesch/Dash-WebServices>.

Pour lancer le frontend sans avoir à utiliser le backend en local, il est
possible d'exécuter la commande :

> npm run start:dev

Cette commande va permettre de se connecter au backend déployé sur Heroku
directement.

Sinon, il est possible de récupérer le backend via Docker en commençant par sa
base de données :

> docker pull postgres:16.3-alpine3.20
> docker run -p 5432:5432 -d -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=dash
> postgres:16.3-alpine3.20;

et son image Docker :

> docker pull arnaudf93/dashwebservices:latest

puis de l'exécuter via la commande :

> docker run -p 8080:8080 -d -e POSTGRES_PASSWORD=postgres -e OPENWEATHERMAP_KEY=${OPENWEATHERMAP_KEY}
> -e STRAVA_CLIENT_ID=${STRAVA_CLIENT_ID}
> -e STRAVA_CLIENT_SECRET=${STRAVA_CLIENT_SECRET} -e STEAM_API_KEY=${STEAM_API_KEY}
> -e AIRPARIF_API_TOKEN=${AIRPARIF_API_TOKEN} arnaudf93/dashwebservices:latest

en renseignant les variables d'environnement nécessaires en suivant le README du
backend ici :
<https://github.com/ArnaudFlaesch/Dash-Webservices#d%C3%A9marrage>

## Commandes utiles

> npm run test

Exécute les tests Jest (\*.spec.ts) présents dans le répertoire **src**.

> npm run test:watch

Même chose que la commande précédente, mais les tests seront réexécutés à chaque
changement du code pour vérifier que l'application fonctionne toujours
correctement.

> npm run cy:open

Lance le dashboard Cypress pour pouvoir exécuter manuellement les tests
End-to-End.

> npm run eslint

Affiche la liste des erreurs liées au code Typescript à partir des règles
définies dans le fichier **.eslintrc.js**.

> npm run lint:styles

Affiche la liste des erreurs liées au code CSS/Sass à partir des conventions et
règles définies dans le fichier **.stylelintrc.json**.

### Couverture de code

![Coverage](https://codecov.io/gh/ArnaudFlaesch/Dash-Web/branch/master/graphs/sunburst.svg)
