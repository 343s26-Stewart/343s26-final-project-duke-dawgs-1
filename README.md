# Project Title: BlockTag

**Duke Dawgs**

**Student Names:** Logan Kasmier, Layla Aure

---

## Purpose

BlockTag is meant to provide a service for following Minecraft players by searching for names, skins, or UUID. By following Minecraft players, the user can access their customizable profile containing a description, links to social platforms, and preset tags for different gameplay styles. Users can search by tags to find players and posts that exhibit the user's preferences, making it simple to find similar players in the Minecraft community. The presence of posts also makes BlockTag a small social platform, where players can meet and invite others to multiplayer servers. The service essentially acts as a home for many Minecraft players, yet provides the foundation for smaller communities with the groups feature. With BlockTag's unique tags system, it is never difficult for users to find others with similar interests in the game of Minecraft.

## Users

BlockTag values inclusivity and accessibility ("a11y"). It is designed primarily for people who love Minecraft.

### Background

The intended audience for BlockTag includes users who can read/listen to natural language. Those without visual impairments will be able to see player profiles and posts. Those with visual impairments will be able to hear descriptions of the profiles and posts.

BlockTag is intended to be used by people who have and have not played Minecraft. People who have played Minecraft can search for their favorite players, make posts, and find people who have similar interests in Minecraft. People who have not played Minecraft can search for a username that they want to use to see if it is taken (Minecraft players must have a unique username), check the feed to see what players do in Minecraft, and look for/join groups that share their interests.

### Needs

The intended users of BlockTag include those with needs such as:

- To find out if a username is available
- To keep track of their favorite Minecraft player's skin and username
- To share posts with other Minecraft players
- To find players with similar interests

## Features

Users of BlockTag will be able to:

- **Search for Minecraft players** by Mojang API means such as:
  - name
  - skins
  - UUID
  - tags (not an API feature; read below)
- **Follow Minecraft players** to receive updates when they post
- **Customize their own profile** with:
  - a colorful description
  - tags that show other users your interests in the game, including builder, casual, PvP, modded, etc.
  - social platform links including Discord and Youtube
- **Create posts** for other users to interact with via feed tab containing:
  - a short description about the gameplay session
  - relevant tags
  - a sign-up field for users to show interest in the multiplayer game
  - a small list of user names that have shown interest
  - *Feed posts allow users to more easily find similar players, so they are also shown in order of both preferred tags and recency.*
- **Create and join groups** of players, which is effectively a friend list with the following bonuses:
  - member posts gain priority in the feed
  - other members are recommended regardless of tags

## Data

Users interact with four core data types through CRUD operations.

A **PlayerProfile** is read-only data fetched from the Mojang API when a user searches for a Minecraft player. Users cannot modify these records directly. A **MyProfile** is created when a user signs up, read by anyone who visits their page, and updated when the user edits their description, tags, or social links. **Posts** are created by users to recruit for gameplay sessions, read on the feed sorted by tag relevance and recency, and deleted by the post author. Other users can update a post's interested players list. **Groups** are created by any user through the groups tab and updated as members join; by the same token, left members will be deleted.

### Data Models

**PlayerProfile**

1. `PlayerName`: string
2. `Skin`: object
   - `Name`: string
   - `Src`: string
3. `UUID`: string
4. `Tags`: string[]

**MyProfile**

1. `Description`: string
2. `Links`: string[]
3. `Tags`: string[]
4. `Following`: PlayerProfile[]

**Post**

1. `PostDescription`: string
2. `PostTags`: string[]
3. `InterestedPlayers`: string[]

**Group**

1. `MemberPosts`: Post[]
2. `Members`: Player[]
