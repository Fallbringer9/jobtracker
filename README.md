

# JobTracker – SaaS Serverless orienté Cloud

## Vision du projet

JobTracker est un projet personnel que j’ai conçu pour approfondir ma maîtrise du cloud AWS à travers un cas concret : la création d’un SaaS serverless sécurisé, déployé en production.

L’objectif n’était pas simplement de créer une application fonctionnelle, mais de réfléchir à une architecture propre, scalable et cohérente avec les bonnes pratiques cloud. Chaque décision technique a été prise dans une logique d’apprentissage orienté infrastructure, sécurité et automatisation.

Ce projet s’inscrit dans mon parcours de montée en compétence vers les métiers du développement cloud.

## Démarche et conception

J’ai utilisé l’IA comme outil d’assistance technique pour accélérer certaines phases (compréhension de services AWS, validation de choix d’architecture, correction d’erreurs), mais l’architecture, les choix techniques et l’intégration globale ont été pensés, structurés et mis en place par moi-même.

L’objectif était de comprendre :

- Comment structurer un SaaS moderne en full serverless
- Comment sécuriser une authentification OAuth2 correctement
- Comment automatiser un déploiement cloud
- Comment organiser une stack cohérente entre frontend, backend et infrastructure

Ce projet est donc à la fois un produit fonctionnel et un terrain d’expérimentation cloud.

## Architecture

L’application repose sur une architecture entièrement serverless sur AWS.

Flux global :

Utilisateur → CloudFront → S3 (frontend statique) → Cognito (authentification) → API Gateway → Lambda → DynamoDB

## Schéma d’architecture

Représentation simplifiée de l’architecture :

Utilisateur (Navigateur)
        ↓
CloudFront (CDN + HTTPS + domaine personnalisé)
        ↓
S3 (Frontend statique – SPA Vite)
        ↓
Cognito (OAuth2 + PKCE)
        ↓
API Gateway (Authorizer Cognito)
        ↓
AWS Lambda (Logique métier – Python)
        ↓
DynamoDB (Stockage NoSQL)

Séparation des responsabilités :

- Le frontend est purement statique et ne contient aucun secret.
- L’authentification est déléguée à Cognito.
- L’API est protégée par validation des JWT.
- La logique métier est isolée dans Lambda.
- Les données sont stockées dans DynamoDB.

Cette séparation permet une architecture modulaire, scalable et maintenable.

Composants principaux :

- Frontend SPA hébergé sur S3
- Distribution via CloudFront avec domaine personnalisé
- Authentification via Amazon Cognito (OAuth2 Authorization Code + PKCE)
- API REST sécurisée via API Gateway
- Logique métier dans AWS Lambda (Python)
- Stockage dans DynamoDB

Cette architecture permet :

- Scalabilité automatique
- Coûts maîtrisés (paiement à l’usage)
- Absence de gestion de serveurs
- Séparation claire des responsabilités

## Pourquoi Cognito

Le choix de Cognito répond à plusieurs objectifs :

- Implémenter un flux OAuth2 propre (Authorization Code avec PKCE)
- Éviter toute gestion manuelle de mots de passe côté backend
- Sécuriser l’API via validation de JWT
- Utiliser un service managé plutôt que développer un système d’authentification maison

Le flux PKCE garantit qu’aucun secret n’est exposé côté frontend et que l’échange de token est sécurisé.

Ce choix s’inscrit dans une logique cloud-native : déléguer les responsabilités critiques (authentification, gestion des identités) à des services spécialisés et managés.

## Infrastructure as Code

L’infrastructure est définie via AWS CDK (Python).

Cela permet :

- Versionner l’infrastructure
- Reproduire l’environnement facilement
- Déployer automatiquement via CI/CD
- Garder une vision claire de l’architecture

Le déploiement est automatisé via GitHub Actions avec authentification OIDC vers AWS.

## Sécurité

Le projet intègre :

- HTTPS uniquement
- Domaine personnalisé
- Flux OAuth2 sécurisé
- Validation des tokens JWT
- Contrôle des inscriptions via Cognito

La sécurité n’est pas ajoutée après coup : elle fait partie de la conception initiale.

## Objectif professionnel

Ce projet me permet de démontrer :

- Ma compréhension des services AWS
- Ma capacité à concevoir une architecture serverless cohérente
- Ma maîtrise de l’authentification moderne (OAuth2 + PKCE)
- Ma capacité à déployer une application complète en environnement cloud

JobTracker n’est pas seulement une application, c’est un projet orienté cloud, pensé comme un exercice d’architecture, de sécurité et d’automatisation.