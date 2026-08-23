# EduX frontend production image
# The repository does not declare a Node version; Node 22 matches the audited local toolchain.
FROM node:22-alpine AS build

WORKDIR /app

# Keep dependency installation cacheable when only application sources change.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
