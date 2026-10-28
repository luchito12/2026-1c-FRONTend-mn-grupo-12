# GitAula front end

A single-page front end for the **Courses** and **Deliveries** packages. Plain HTML, CSS and JavaScript:
no build step, no dependencies. Spring Boot serves it from `static/`, so it shares the origin of the API
(no CORS to configure).

## Install

Copy the three files into the shared app, keeping this path:

```
src/main/resources/static/index.html
src/main/resources/static/styles.css
src/main/resources/static/app.js
```

Run the backend (`./mvnw spring-boot:run`) and open **http://localhost:8080/**.

## What you can do

| Page | Features |
|---|---|
| **Users** | Create or find a user (get-or-create by GitHub username), remember users by id, choose who you are acting as |
| **Commissions** | List the commissions of the active user with their role, create a commission (the creator becomes teacher), enroll a user as student or teacher |
| **Projects** | Pick a commission, create projects (manual or self-organized teams), create teams, join / leave a team, move a member to another team, confirm a team, advance a delivery (Created, In progress, Finished) |

The backend has no login and no endpoint to list users, so the page remembers in this browser (localStorage) the
users you create. The **Acting as** menu in the header decides who each request is made for.

- **Roles.** Each role only sees its own actions in a commission: the teacher creates projects, builds manual teams,
  confirms and moves members; students create or join teams in self-organized projects.
- **Test mode** (Settings): shows every action whatever the role, to try the backend rules (the 409 and 400 answers).
- **API activity** (footer): every request the page sends, with its status. Handy to see what each button calls.

## Accessibility

Target: WCAG 2.2 level AA.

- **Contrast, measured.** Body text 16:1, muted text 9:1, accent colors used as text from 5.2:1 to 10:1,
  borders of fields and the focus ring 4:1 or more. Palette: ink `#0c1024`, panel `#151b3a`, cyan `#3de6ff`
  (primary), magenta `#ff5cb8` (teacher), violet `#b8a2ff` (student), lime `#b8f53d` (confirmed, finished),
  amber `#ffc53d` (forming, in progress, focus), coral `#ff7a7a` (errors).
- **Color is never the only signal.** Roles, team states and delivery steps always carry a word and a symbol; the
  delivery tracker marks done / current / pending with text and shape; the current page has a thick underline.
- **Keyboard.** Everything works with the keyboard, with a visible 3px focus ring, a skip link, and focus moving to
  the page title or to the team you just changed.
- **Screen readers.** Landmarks and one `h2` per page, real labels and hints linked with `aria-describedby`, errors
  linked to their field with `aria-invalid`, results announced through `role="status"` / `role="alert"`, tables with
  caption and column headers, buttons with a visually hidden context ("Join this team as Maria").
- **Touch and zoom.** Targets of 44px or more, rem units, layout that reflows on small screens.
- **User preferences.** `prefers-reduced-motion`, `prefers-contrast` and forced colors are respected.

Fonts (Bricolage Grotesque, Atkinson Hyperlegible) load from Google Fonts. If they cannot load, system fonts are used.

## Notes

- To open the page from another origin (for example a live-server), type the backend address in **Settings, API address**
  and allow CORS in the backend.
- Nothing is stored in the backend by the page itself: "Forget users and saved data" only clears this browser.
- User-provided text is always inserted as text, never as HTML.
- Interface text is in English, like the code and the API.
