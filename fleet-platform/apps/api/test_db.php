<?php
// Direct SQLite query
$sqlite = new PDO('sqlite:database/database.sqlite');

$tables = ['users', 'vehicles', 'drivers', 'vendors', 'preventive_rules', 'quotes'];

echo "Database Tables:\n";
foreach ($tables as $table) {
    try {
        $stmt = $sqlite->query("SELECT COUNT(*) as cnt FROM $table");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "  $table: " . $result['cnt'] . "\n";
    } catch (Exception $e) {
        echo "  $table: ERROR - " . $e->getMessage() . "\n";
    }
}

echo "\nFirst User:\n";
$stmt = $sqlite->query("SELECT * FROM users LIMIT 1");
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if ($user) {
    foreach ($user as $key => $value) {
        echo "  $key: $value\n";
    }
}

echo "\nAll Users:\n";
$stmt = $sqlite->query("SELECT id, email, tenant_id FROM users");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  [" . $row['id'] . "] " . $row['email'] . " (tenant: " . $row['tenant_id'] . ")\n";
}
?>
