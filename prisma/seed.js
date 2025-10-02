// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')   // use bcryptjs (safe on Mac)

const prisma = new PrismaClient()

async function main() {
  const permissions = [
    "manage_users",
    "invite_users",
    "view_users",
    "manage_roles",
    "manage_permissions",
    "manage_company",
    "manage_departments",
    "view_departments",
    "view_dashboard",
    "assign_tasks",
    "approve_content",
    "upload_design",
    "view_reports",
    "manage_settings",
    "manage_billing",
    "manage_audit_logs",
    "superadmin_all"
  ]

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p },
      update: {},
      create: { name: p, description: `Permission to ${p.replace(/_/g, ' ')}` }
    })
  }

  const company = await prisma.company.upsert({
    where: { domain: "superadmin.local" },
    update: {},
    create: {
      name: "SuperAdmin Org",
      domain: "superadmin.local",
      description: "Root company for superadmins"
    }
  })

  const role = await prisma.role.upsert({
    where: { name_companyId: { name: "SuperAdmin", companyId: company.id } },
    update: {},
    create: { name: "SuperAdmin", description: "Has all permissions", companyId: company.id }
  })

  for (const p of permissions) {
    const perm = await prisma.permission.findUnique({ where: { name: p } })
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id }
      })
    }
  }

  const passwordHash = await bcrypt.hash("SuperSecret123!", 10)

  await prisma.employee.upsert({
    where: { email: "superadmin@local.com" },
    update: {},
    create: {
      firstName: "Super",
      lastName: "Admin",
      email: "superadmin@local.com",
      passwordHash,
      companyId: company.id,
      roleId: role.id,
      status: "ACTIVE"
    }
  })

  console.log("✅ SuperAdmin seeded with all permissions!")
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
