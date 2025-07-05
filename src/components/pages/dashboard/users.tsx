"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/store"
import { userService, type UserProfile } from "@/lib/services/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, UserMinus, Edit, Mail, Users, Shield, User, Crown } from "lucide-react"

export function UsersPage() {
  const { userProfile, isOwner } = useAuthStore()
  const { toast } = useToast()
  
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  
  // Add user form
  const [addUserForm, setAddUserForm] = useState({
    email: "",
    role: "employee" as "admin" | "employee"
  })

  // Edit user form
  const [editUserForm, setEditUserForm] = useState({
    name: "",
    role: "employee" as "admin" | "employee"
  })

  // Check if user is owner
  if (!isOwner()) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="text-muted-foreground">Only organization owners can manage users.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fetchUsers = async () => {
    if (!userProfile?.company_id) return
    
    setLoading(true)
    try {
      const fetchedUsers = await userService.getUsersByCompany(userProfile.company_id)
      setUsers(fetchedUsers)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [userProfile?.company_id])

  const handleAddUser = async () => {
    if (!userProfile?.company_id || !addUserForm.email) return

    setLoading(true)
    try {
      const result = await userService.addUserToCompany(
        addUserForm.email,
        userProfile.company_id,
        addUserForm.role
      )

      if (result.success) {
        toast({
          title: "Success",
          description: "User added to organization successfully"
        })
        setAddUserOpen(false)
        setAddUserForm({ email: "", role: "employee" })
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add user",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    setLoading(true)
    try {
      const updateData: any = {}
      if (editUserForm.name !== selectedUser.name) {
        updateData.name = editUserForm.name
      }
      if (editUserForm.role !== selectedUser.role) {
        updateData.role = editUserForm.role
      }

      const result = await userService.updateUser(selectedUser.id, updateData)

      if (result.success) {
        toast({
          title: "Success",
          description: "User updated successfully"
        })
        setEditUserOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update user",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (user: UserProfile) => {
    setLoading(true)
    try {
      const result = await userService.removeUserFromCompany(user.id)

      if (result.success) {
        toast({
          title: "Success",
          description: "User removed from organization"
        })
        fetchUsers()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove user",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user)
    setEditUserForm({
      name: user.name || "",
      role: user.role === "owner" ? "admin" : user.role as "admin" | "employee"
    })
    setEditUserOpen(true)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      owner: "default",
      admin: "secondary",
      employee: "outline",
      visitor: "destructive"
    }

    return (
      <Badge variant={variants[role] || "outline"} className="gap-1">
        {getRoleIcon(role)}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">
            Manage users in your organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add User to Organization</DialogTitle>
                <DialogDescription>
                  Enter the email address of the user you want to add. They must already have an account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={addUserForm.email}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={addUserForm.role}
                    onValueChange={(value: "admin" | "employee") => 
                      setAddUserForm(prev => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} disabled={loading || !addUserForm.email}>
                  {loading ? "Adding..." : "Add User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Users
          </CardTitle>
          <CardDescription>
            {users.length} user{users.length !== 1 ? 's' : ''} in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No users found</h3>
              <p className="text-muted-foreground">Add users to your organization to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.name || "No name"}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.role !== "owner" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                              className="gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
                                  <UserMinus className="h-3 w-3" />
                                  Remove
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove {user.name || user.email} from your organization?
                                    This will set their role to "visitor" and remove access to your company data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleRemoveUser(user)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Remove User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="User name"
                value={editUserForm.name}
                onChange={(e) => setEditUserForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editUserForm.role}
                onValueChange={(value: "admin" | "employee") => 
                  setEditUserForm(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={loading}>
              {loading ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 