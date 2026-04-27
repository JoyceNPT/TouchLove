# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /source

# Copy solution and project files
COPY *.slnx .
COPY src/TouchLove.API/*.csproj src/TouchLove.API/
COPY src/TouchLove.Application/*.csproj src/TouchLove.Application/
COPY src/TouchLove.Domain/*.csproj src/TouchLove.Domain/
COPY src/TouchLove.Infrastructure/*.csproj src/TouchLove.Infrastructure/
COPY src/TouchLove.Shared/*.csproj src/TouchLove.Shared/

# Restore dependencies
RUN dotnet restore TouchLove.slnx

# Copy everything else and build
COPY . .
WORKDIR /source/src/TouchLove.API
RUN dotnet publish -c Release -o /app

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .

# Create uploads directory
RUN mkdir -p /app/wwwroot/uploads

ENTRYPOINT ["dotnet", "TouchLove.API.dll"]
