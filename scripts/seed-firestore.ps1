param(
  [string]$ProjectId = 'fleet-management-57ff5',
  [string]$ApiKey = 'AIzaSyAlDL1BmhL4Cc_uOpoyszuyRWDI-TGDAjs',
  [string]$AdminEmail = 'admin@acb.local',
  [string]$AdminPassword = 'password'
)

$ErrorActionPreference = 'Stop'

function Convert-ToFsValue($value) {
  if ($null -eq $value) { return @{ nullValue = $null } }
  if ($value -is [string]) { return @{ stringValue = $value } }
  if ($value -is [bool]) { return @{ booleanValue = $value } }
  if ($value -is [int] -or $value -is [long]) { return @{ integerValue = [string]$value } }
  if ($value -is [double] -or $value -is [float] -or $value -is [decimal]) { return @{ doubleValue = [double]$value } }
  if ($value -is [datetime]) { return @{ timestampValue = $value.ToUniversalTime().ToString('o') } }

  if ($value -is [System.Collections.IEnumerable] -and -not ($value -is [string]) -and -not ($value -is [hashtable])) {
    $arr = @()
    foreach ($item in $value) { $arr += Convert-ToFsValue $item }
    return @{ arrayValue = @{ values = $arr } }
  }

  if ($value -is [hashtable]) {
    $fields = @{}
    foreach ($k in $value.Keys) { $fields[$k] = Convert-ToFsValue $value[$k] }
    return @{ mapValue = @{ fields = $fields } }
  }

  return @{ stringValue = [string]$value }
}

function To-FsFields($obj) {
  $fields = @{}
  foreach ($k in $obj.Keys) { $fields[$k] = Convert-ToFsValue $obj[$k] }
  return @{ fields = $fields }
}

function Invoke-FirebasePasswordSignIn($apiKey, $email, $password) {
  $signInUrl = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$apiKey"
  $signInBody = @{ email = $email; password = $password; returnSecureToken = $true } | ConvertTo-Json
  return Invoke-RestMethod -Method Post -Uri $signInUrl -ContentType 'application/json' -Body $signInBody
}

function New-FirebaseEmailPasswordUser($apiKey, $email, $password) {
  $signUpUrl = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$apiKey"
  $signUpBody = @{ email = $email; password = $password; returnSecureToken = $true } | ConvertTo-Json
  return Invoke-RestMethod -Method Post -Uri $signUpUrl -ContentType 'application/json' -Body $signUpBody
}

function Ensure-FirebasePasswordUser($apiKey, $email, $password) {
  try {
    return Invoke-FirebasePasswordSignIn -apiKey $apiKey -email $email -password $password
  } catch {
    try {
      $created = New-FirebaseEmailPasswordUser -apiKey $apiKey -email $email -password $password
      return $created
    } catch {
      throw "Failed to provision Firebase Auth user for $email. $($_.Exception.Message)"
    }
  }
}

function Invoke-FirestorePatchDoc($projectId, $collection, $docId, $data, $headers) {
  $url = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/$collection/$docId"
  $body = (To-FsFields $data) | ConvertTo-Json -Depth 40
  Invoke-RestMethod -Method Patch -Uri $url -Headers $headers -ContentType 'application/json' -Body $body | Out-Null
}

$auth = Ensure-FirebasePasswordUser -apiKey $ApiKey -email $AdminEmail -password $AdminPassword
$headers = @{ Authorization = "Bearer $($auth.idToken)" }
$now = (Get-Date).ToUniversalTime().ToString('o')

$builtInUsers = @(
  @{ email = 'admin@acb.local'; password = 'password'; name = 'Admin User'; tenant = 'acb'; roles = @('admin'); permissions = @('*') },
  @{ email = 'sm@acb.local'; password = 'password'; name = 'Service Manager'; tenant = 'acb'; roles = @('manager'); permissions = @('view_vehicles','view_service_requests','edit_service_requests','view_work_orders','edit_work_orders') },
  @{ email = 'workshop@acb.local'; password = 'password'; name = 'Workshop User'; tenant = 'acb'; roles = @('technician'); permissions = @('view_service_requests','edit_service_requests','view_work_orders','edit_work_orders') },
  @{ email = 'owner@sgs.local'; password = 'password'; name = 'Fleet Owner'; tenant = 'sgs'; roles = @('admin'); permissions = @('*') },
  @{ email = 'approver@sgs.local'; password = 'password'; name = 'Approver User'; tenant = 'sgs'; roles = @('approver'); permissions = @('view_quotes','approve_quotes','view_work_orders','create_work_orders') },
  @{ email = 'dispatcher@sgs.local'; password = 'password'; name = 'Dispatcher User'; tenant = 'sgs'; roles = @('dispatcher'); permissions = @('view_service_requests','create_service_requests','view_vehicles','view_drivers') }
)

foreach ($u in $builtInUsers) {
  $signedIn = Ensure-FirebasePasswordUser -apiKey $ApiKey -email $u.email -password $u.password
  Invoke-FirestorePatchDoc -projectId $ProjectId -collection 'users' -docId $signedIn.localId -headers @{ Authorization = "Bearer $($signedIn.idToken)" } -data @{
    name = $u.name
    tenant_id = $u.tenant
    roles_names = $u.roles
    permissions_names = $u.permissions
    created_at = $now
    updated_at = $now
    email = $u.email
  }
}

$seed = @{
  vehicles = @(
    @{ id='veh-acb-001'; plate_no='ABC-1234'; make='Toyota'; model='Hilux'; year=2022; status='active'; mileage=45210; tenant_id='acb'; created_at=$now; updated_at=$now },
    @{ id='veh-acb-002'; plate_no='XYZ-8891'; make='Isuzu'; model='D-Max'; year=2021; status='maintenance'; mileage=78300; tenant_id='acb'; created_at=$now; updated_at=$now }
  )
  drivers = @(
    @{ id='drv-acb-001'; name='John Santos'; email='john.santos@acb.local'; phone='+639171001001'; license_no='N01-23-456789'; status='active'; tenant_id='acb'; created_at=$now; updated_at=$now },
    @{ id='drv-acb-002'; name='Maria Cruz'; email='maria.cruz@acb.local'; phone='+639171001002'; license_no='N02-34-567890'; status='active'; tenant_id='acb'; created_at=$now; updated_at=$now }
  )
  service_requests = @(
    @{ id='sr-acb-001'; title='Brake inspection'; description='Front brake pads check'; priority='high'; status='open'; vehicle_id='veh-acb-001'; tenant_id='acb'; created_at=$now; updated_at=$now },
    @{ id='sr-acb-002'; title='Oil change'; description='10k km PMS'; priority='medium'; status='in_progress'; vehicle_id='veh-acb-002'; tenant_id='acb'; created_at=$now; updated_at=$now }
  )
  work_orders = @(
    @{ id='wo-acb-001'; work_order_no='WO-2026-001'; service_request_id='sr-acb-001'; status='open'; labor_cost=2500; parts_cost=1800; total_cost=4300; tenant_id='acb'; created_at=$now; updated_at=$now },
    @{ id='wo-acb-002'; work_order_no='WO-2026-002'; service_request_id='sr-acb-002'; status='in_progress'; labor_cost=1800; parts_cost=1200; total_cost=3000; tenant_id='acb'; created_at=$now; updated_at=$now }
  )
  invoices = @(
    @{ id='inv-acb-001'; invoice_no='INV-2026-001'; customer_name='ACB Logistics'; amount=4300; status='unpaid'; due_date='2026-03-15'; tenant_id='acb'; created_at=$now; updated_at=$now },
    @{ id='inv-acb-002'; invoice_no='INV-2026-002'; customer_name='ACB Logistics'; amount=3000; status='paid'; due_date='2026-03-01'; tenant_id='acb'; created_at=$now; updated_at=$now }
  )
  quotes = @(
    @{ id='quo-acb-001'; quote_no='QT-2026-001'; customer_name='ACB Logistics'; amount=5200; status='draft'; tenant_id='acb'; created_at=$now; updated_at=$now },
    @{ id='quo-acb-002'; quote_no='QT-2026-002'; customer_name='ACB Logistics'; amount=7100; status='approved'; tenant_id='acb'; created_at=$now; updated_at=$now }
  )
  vendors = @(
    @{ id='ven-acb-001'; name='Metro Parts Supply'; contact_person='R. Dela Cruz'; email='sales@metroparts.local'; phone='+63281230001'; status='active'; tenant_id='acb'; created_at=$now; updated_at=$now }
  )
  approvals = @(
    @{ id='apr-acb-001'; entity_type='quote'; entity_id='quo-acb-002'; status='approved'; approver='admin@acb.local'; notes='Approved for dispatch'; tenant_id='acb'; created_at=$now; updated_at=$now }
  )
  preventive_rules = @(
    @{ id='pr-acb-001'; name='Oil Change Every 10000km'; trigger_type='mileage'; trigger_value=10000; is_active=$true; tenant_id='acb'; created_at=$now; updated_at=$now }
  )
  notifications = @(
    @{ id='not-acb-001'; title='Work Order Due'; message='WO-2026-001 pending assignment'; type='warning'; status='pending'; tenant_id='acb'; created_at=$now; updated_at=$now }
  )
  roles = @(
    @{ id='role-acb-admin'; name='admin'; description='Tenant administrator'; permissions_names=@('*'); tenant_id='acb'; created_at=$now; updated_at=$now }
  )
}

Write-Host 'Seeding Firestore sample data...'

foreach ($collection in $seed.Keys) {
  foreach ($doc in $seed[$collection]) {
    $docId = $doc.id
    $payload = @{}
    foreach ($k in $doc.Keys) {
      if ($k -ne 'id') { $payload[$k] = $doc[$k] }
    }
    Invoke-FirestorePatchDoc -projectId $ProjectId -collection $collection -docId $docId -data $payload -headers $headers
  }
  Write-Host "- $collection seeded"
}

Write-Host 'Seed complete.'
