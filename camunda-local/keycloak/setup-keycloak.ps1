# Creates the "microlending" realm (roles, login client and 3 users) in the local Keycloak.
# Run once after Keycloak is up:   powershell -File setup-keycloak.ps1

$keycloak = "http://localhost:18080/auth"

# 1. Get an admin token (Keycloak admin user from docker-compose.yaml)
$token = (Invoke-RestMethod -Method Post -Uri "$keycloak/realms/master/protocol/openid-connect/token" -Body @{
    grant_type = "password"
    client_id  = "admin-cli"
    username   = "admin"
    password   = "admin"
}).access_token

# 2. Create the realm from microlending-realm.json
$realmJson = Get-Content -Raw -Path "$PSScriptRoot\microlending-realm.json"
try {
    Invoke-RestMethod -Method Post -Uri "$keycloak/admin/realms" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $realmJson
    Write-Host "Realm 'microlending' created."
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 409) {
        # Realm already exists: add any users from the file that are missing (existing ones are skipped)
        $realm = $realmJson | ConvertFrom-Json
        $import = @{ ifResourceExists = "SKIP"; users = $realm.users } | ConvertTo-Json -Depth 10
        $result = Invoke-RestMethod -Method Post -Uri "$keycloak/admin/realms/microlending/partialImport" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $import
        Write-Host "Realm 'microlending' already exists. Users added: $($result.added), already there: $($result.skipped)"

        # Copy first/last names from the file to the existing users (passwords are not touched)
        foreach ($u in $realm.users) {
            $found = Invoke-RestMethod -Uri "$keycloak/admin/realms/microlending/users?username=$($u.username)&exact=true" -Headers @{ Authorization = "Bearer $token" }
            if ($found.Count -gt 0) {
                $names = @{ firstName = $u.firstName; lastName = $u.lastName } | ConvertTo-Json
                Invoke-RestMethod -Method Put -Uri "$keycloak/admin/realms/microlending/users/$($found[0].id)" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $names
                Write-Host "  $($u.username) = $($u.firstName) $($u.lastName)"
            }
        }
    } else {
        throw
    }
}
