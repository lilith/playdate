# playdate

_get texts when your kid's friends are free. broadcast texts to their parents when you're free. save time automatically. schedule easier. build friendships. make memories._

[playdate.help](https://playdate.help) saves time and helps build friendships by coordinating tentative availability between parents for playdates. It's open-source (AGPLv3) and non-commercial.

The [design document draft is here](https://docs.google.com/document/d/18AJJTOX9x-pXl4mSTfKHp_9Op4cszZLhZkb9UiQZbNA/edit?usp=sharing) (comment and edit!)

ideal tech stack: SvelteKit, Twilio, PostgreSQL, DigitalOcean/Heroku/app platform.

## notes:

- [magic links](https://medium.com/@aleksandrasays/sending-magic-links-with-nodejs-765a8686996)
- [magic links w/ static len token](https://www.antoniovdlc.me/password-less-authentication-using-magic-links/)


## Sending SMS / friend links

We might not want to text friends and co-parents unless they've opted into to getting texts from us. What we *can* do, fortunately, is use an SMS hyperlink.

This does mean that inviting friends becomes a two-step process - the app creates a friend request record in the database, and then the app produces a clickable link for the inviting member to use to text their friend

Ex: `<a href="sms:+18664504185?&body=Hi%2520there%252C%2520I%2527d%2520like%2520to%2520place%2520an%2520order%2520for...">Click here to text us!</a>`

Since that link is shared with both parties, it can't handle authentication - it requires the user to confirm their phone number and get a 2nd text. We can pre-fill the target's phone number, though, e.g. 
https://playdate.help/login?phone=+18664504185


## Schema

There's [a separate google doc to focus on schema and implementation stuff](https://docs.google.com/document/d/1YjIzEWKNcBJNziDydF2LP-iSUg0OJrLn5KRN4tNtT_s/edit?usp=sharing). 

https://www.prismabuilder.io/


### Strings

We want to use UTF-8 everywhere possible. 

### IDs

Note that it's unclear if a separate id is needed in Prisma. While the Prisma schema definition language permits strings as primary keys, ORMs often have an optimal path designed for integer IDs that are auto-incremented. Thus, even if redundant, integer IDs are specified here and we are adding unique constraints and indexes on the string values that would otherwise serve as the primary key.

### Dates
Also, all dates are stored as UTC. We convert those to the user's timezone (User.) when displaying them.

### Phone numbers are E.164 (+1 (555) 123-7777 would be "15551237777")

All phone numbers should be stored as max-15 digit strings in E.164 format. This format is purely numeric and does not include the assumed "+" prefix. "+" is a dial-out code, equivalent to "011" on landlines calling from the US to other countries. It's not part of the phone number itself, and the numeric equivalent to "+" varies depending on the country you're calling from. 
Google's libphonenumber library can be used to parse and format phone numbers. https://github.com/google/libphonenumber

Here's a parser demo: https://rawgit.com/googlei18n/libphonenumber/master/javascript/i18n/phonenumbers/demo-compiled.html

For now, we default to "US" as the country, and reject non-US numbers. We'll use US-centric formatting for display "(555) 123-7777". 

In years, if this goes international, we can extract the country from the phone number with libphonenumber, and use that to determine if a caller's country is different than the friend's country, and adapt display to include country code information.

### Draft schema

```prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}


model Household {
    id              Int      @id @default(autoincrement())
    name            String
    publicNotes     String?
    parents         User[]              // implicit 1-many
    children        HouseholdChild[]    // implicit 1-many

    // We may eventually want to have explicit control over the many-to-many relationship 
    // But there's no concrete need for that yet
    friends         Household[] // implicit many-to-many table created behind the scenes
    
    
    outboxFriendRequests FriendRequest[]  @relation(fields: [id], references: [fromHouseholdId])
    outboxHouseholdRequests JoinHouseholdRequest[]  @relation(fields: [id], references: [householdId])

    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
}

// For inviting other households to be friends with yours
model FriendRequest {
    id              Int      @id @default(autoincrement())
    expires         DateTime?
    targetPhone     String // The target may not have an account yet, so we can't use a foreign key
    fromUserId    Int
    fromUser      User @relation(fields: [fromUserId], references: [id])
    fromHouseholdId     Int
    fromHousehold       Household @relation(fields: [fromHouseholdId], references: [id])
    createdAt       DateTime @default(now())
    @@index([secret])
}

// For inviting co-parents to join a household
model JoinHouseholdRequest {
    id              Int      @id @default(autoincrement())
    expires         DateTime?
    targetPhone     String      // The target may not have an account yet, so we can't use a foreign key
    householdId     Int
    household       Household @relation(fields: [householdId], references: [id])
    fromUserId    Int
    fromUser      User @relation(fields: [fromUserId], references: [id])
    createdAt       DateTime @default(now())
    @@index([secret])
}

model HouseholdChild {
    id          Int      @id @default(autoincrement())
    householdId Int
    household   Household @relation(fields: [householdId], references: [id])

    firstName   String

    pronounSetId    Int
    pronounSet      PronounSet @relation(fields: [pronounSetId], references: [id])

    lastName    String?
    dateOfBirth DateTime?

    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
}

// For performance, we could duplicate the phone # inside the secret field, like "18129898260/secret". That way we can do a single index lookup on phone # and secret.
// This streamlines testing a login validity.
// We then just verify that the login link hasn't expired. If it has expired or the record has been purged, we can extract the phone number
// from the url to pre-populate the phone number field on the login page.

model MagicLink{
    id         Int      @id @default(autoincrement())
    secret	   String   @unique // 9 bytes of random data, base64 encoded into 12 characters
    phone      String   // E.164 format, max 15 digits
    user       User?    @relation(fields: [phone], references: [phone]) // There may not be a user yet
    expires    DateTime
    createdAt  DateTime @default(now())
    @@index([secret])
}

// We create a session after validating a magic link 
model Session {
    id         Int      @id @default(autoincrement())
    secret	   String   @unique
    phone      String   // E.164 format, max 15 digits
    expires    DateTime
    user       User     @relation(fields: [userId], references: [id])
    userId     Int
    createdAt  DateTime @default(now())
}


// We don't want to rely exclusively on Twilio to track STOP/START commands
// We also need to know if a phone # can receive messages. 
// And we want to guide users to opt out of specific kinds of messages, like reminders and friend invites, rather than blocking all messages (which breaks login links!)
// We also don't want a user to have to create a user account just to block friend invites. 
model PhoneContactPermissions {
    phone       String   @id  // Let's see if it's very difficult to have a string as ID. It could be a regular @unique field, but then we'd have to add an index on it.

    blocked     Boolean

    allowInvites Boolean
    allowReminders Boolean

    acceptedTermsAt DateTime?

    user User? @relation(fields: [phone], references: [phone])

    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
}

// Don't create a User until after a magic link has verified the phone number
model User {
    id              Int      @id @default(autoincrement())

    // Optional, because we may not have created a household yet.
    householdId     Int?
    household       Household? @relation(fields: [householdId], references: [id])

    // What if our household was sent a friend request, but to a different parent? 
    // Thus we have to check household.parents (each) for inboxFriendRequestsPartial and combine 
    // We may want to optimize this one query to prevent N+1 issues
    inboxFriendRequestsPartial FriendRequest[]  @relation(fields: [phone], references: [targetPhone])

    // This very infrequently used query is for when a co-parent has invitied you to an existing household
    inboxHouseholdJoinRequests JoinHouseholdRequest[]  @relation(fields: [phone], references: [targetPhone])

    locale      String  // Like en_US or es_MX - used both for formatting numbers/dates and for translation

    firstName       String
    lastName        String?

    phone           String @unique
    phonePermissions PhoneContactPermissions @relation(fields: [phone], references: [phone])

    timeZone        String   // Time zone string, like "America/Los_Angeles"

    pronounSetId    Int
    pronounSet      PronounSet @relation(fields: [pronounSetId], references: [id])

    // We automatically lock accounts that are reported for impersonation 
    locked          Boolean @default(FALSE)
    lockedReason    String?

    // Email is a backup communication method in case the phone number is not usable
    // We make a copy of the address when it is verified, so that the verified flag doesn't stay when the user changes their email address
    email           String?
    emailVerified   String?

    reminderDatetime DateTime
    reminderIntervalDays Int

    acceptedTermsAt DateTime

    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt

    @@index([phone])
}


model AvailabilityDate {
    id          Int      @id @default(autoincrement())
    householdId Int
    household   Household @relation(fields: [householdId], references: [id])

    parentId    Int? // Eventually we may allow specifying which parent is available
    parent      User? @relation(fields: [parentId], references: [id]) 

    childId     Int? // And separately, which child is available. For now we assume there's a primary child and a primary parent and let people specify variations in the notes.
    child       HouseholdChild? @relation(fields: [childId], references: [id])

    date        DateTime
    status      AvailabilityStatus @default(UNSPECIFIED) // We don't delete records, we just mark them as unspecified
    startTime   DateTime
    endTime     DateTime

    notes       String? // shared notes
    emoticons   String? // shared emoticons 

    updatedAt   DateTime @updatedAt
    createdAt   DateTime @default(now())
}


// We could make PronounSet an enum and hardcode it, if it simplifies things.
model PronounSet {
    id                  Int      @id @default(autoincrement())
    langCode            String
    subjective      String // he / she / they
    objective       String  // him / her / them
    possessive      String // his / her / their
    possessiveDeterminer String // his / her / their
    reflexive       String // himself / herself / themselves
    createdAt       DateTime @default(now())
}


enum AvailabilityStatus {
  UNSPECIFIED
  BUSY
  AVAILABLE
}
```

```prisma

// This describes the circle of friends that a household has. It's a many-to-many relationship.
// Ignore for now, it's autocreated
model HouseholdConnection {
    id                  Int      @id @default(autoincrement())
    householdId         Int
    household           Household @relation(fields: [householdId], references: [id])
    friendHouseholdId   Int
    friendHousehold     Household @relation(fields: [friendHouseholdId], references: [id])
    createdAt       DateTime @default(now())
}

// Ignore this model for now, it's a later feature
model ImpersonationReport {
    id              Int      @id @default(autoincrement())
    reportedUserId  Int
    reportedUser    User @relation(fields: [reportedUserId], references: [id])
    reporterUserId  Int
    reporterUser    User @relation(fields: [reporterUserId], references: [id])
    notes           String?
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
}

```