"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, orderBy, limit } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Trash2, CheckCircle, XCircle, Building, Users, Activity, FileText, ArrowRight, LogOut, MapPin } from "lucide-react";
import UserMonitoring from "@/components/UserMonitoring";

export default function AdminPage() {
    const { user, loading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'branches' | 'monitoring'>('overview');
    const [users, setUsers] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [recentReports, setRecentReports] = useState<any[]>([]);
    const [newBranchName, setNewBranchName] = useState("");
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ role: "", jobTitle: "" });




    // Fetch Users
    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersData);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Branches
    useEffect(() => {
        const q = query(collection(db, "branches"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const branchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBranches(branchesData);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Recent Activity (Reports)
    useEffect(() => {
        const q = query(collection(db, "reports"), orderBy("timestamp", "desc"), limit(10));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecentReports(reportsData);
        });
        return () => unsubscribe();
    }, []);

    const handleAddBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBranchName) return;
        try {
            await addDoc(collection(db, "branches"), {
                name: newBranchName,
                createdAt: new Date().toISOString()
            });
            setNewBranchName("");
        } catch (error) {
            console.error("Error adding branch:", error);
            alert("Failed to add branch");
        }
    };



    const handleEditUser = (user: any) => {
        setEditingUser(user);
        setEditForm({ role: user.role, jobTitle: user.jobTitle });
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        try {
            await updateDoc(doc(db, "users", editingUser.id), {
                role: editForm.role,
                jobTitle: editForm.jobTitle
            });
            setEditingUser(null);
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user");
        }
    };

    const handleDeleteBranch = async (ignore: any, id: string) => {
        if (!confirm("Are you sure you want to delete this branch?")) return;
        try {
            await deleteDoc(doc(db, "branches", id));
        } catch (error) {
            console.error("Error deleting branch:", error);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Loading...</div>;
    }

    if (!loading && (!user || user.role !== 'admin')) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                <p>Status: {user ? "Logged In" : "Not Logged In"}</p>
                {user && (
                    <div className="text-zinc-400 text-center">
                        <p>Email: {user.email}</p>
                        <p>Role: {user.role}</p>
                        <p>Job Title: {user.jobTitle}</p>
                    </div>
                )}
                <button
                    onClick={() => logout()}
                    className="mt-4 px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700"
                >
                    Logout & Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors border border-zinc-700"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-8 border-b border-zinc-800 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-2 px-4 flex items-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-zinc-400'}`}
                    >
                        <Activity size={18} /> Overview & Activity
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-2 px-4 flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-zinc-400'}`}
                    >
                        <Users size={18} /> User Management
                    </button>
                    <button
                        onClick={() => setActiveTab('branches')}
                        className={`pb-2 px-4 flex items-center gap-2 whitespace-nowrap ${activeTab === 'branches' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-zinc-400'}`}
                    >
                        <Building size={18} /> Branch Management
                    </button>
                    <button
                        onClick={() => setActiveTab('monitoring')}
                        className={`pb-2 px-4 flex items-center gap-2 whitespace-nowrap ${activeTab === 'monitoring' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-zinc-400'}`}
                    >
                        <MapPin size={18} /> Live Monitoring
                    </button>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                                <h3 className="text-zinc-400 text-sm font-medium">Total Users</h3>
                                <p className="text-3xl font-bold text-white mt-2">{users.length}</p>
                            </div>
                            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                                <h3 className="text-zinc-400 text-sm font-medium">Active Sites</h3>
                                <p className="text-3xl font-bold text-white mt-2">{branches.length}</p>
                            </div>
                            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                                <h3 className="text-zinc-400 text-sm font-medium">Recent Reports</h3>
                                <p className="text-3xl font-bold text-white mt-2">{recentReports.length}</p>
                            </div>
                        </div>

                        {/* Recent Activity Feed */}
                        <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-indigo-400" />
                                Recent Activity
                            </h2>
                            <div className="space-y-4">
                                {recentReports.map((report) => (
                                    <div key={report.id} className="flex items-start gap-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
                                        <div className={`p-2 rounded-full ${report.status === 'bad' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                            <Activity size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">
                                                {report.userName} <span className="text-zinc-500">reported</span> {report.categoryName}
                                            </p>
                                            <p className="text-xs text-zinc-400 mt-1">
                                                Site: {report.branchId} • {new Date(report.timestamp).toLocaleString()}
                                            </p>
                                            {report.note && (
                                                <p className="text-sm text-zinc-300 mt-2 bg-zinc-900/50 p-2 rounded">
                                                    "{report.note}"
                                                </p>
                                            )}
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${report.status === 'bad' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                                            {report.status.toUpperCase()}
                                        </div>
                                    </div>
                                ))}
                                {recentReports.length === 0 && (
                                    <p className="text-zinc-500 text-center py-8">No recent activity found.</p>
                                )}
                            </div>
                        </div>
                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setActiveTab('branches')}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl hover:border-indigo-500 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:text-indigo-300">
                                        <Building size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-white">Manage Sites</h3>
                                        <p className="text-xs text-zinc-400">Add or remove operating branches</p>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
                            </button>

                            <button
                                onClick={() => setActiveTab('users')}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-xl hover:border-blue-500 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 group-hover:text-blue-300">
                                        <Users size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-semibold text-white">Manage Users</h3>
                                        <p className="text-xs text-zinc-400">View registered users and roles</p>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-zinc-500 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                        <h2 className="text-xl font-semibold mb-4">Registered Users</h2>
                        {/* Edit User Modal/Form */}
                        {editingUser && (
                            <div className="mb-6 p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-white">Edit User: {editingUser.email}</h3>
                                    <button onClick={() => setEditingUser(null)} className="text-zinc-400 hover:text-white"><XCircle size={20} /></button>
                                </div>
                                <form onSubmit={handleUpdateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1">Role</label>
                                        <select
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                            className="w-full rounded bg-zinc-700 border-zinc-600 text-white text-sm px-3 py-2"
                                        >
                                            <option value="user">User</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1">Job Title</label>
                                        <input
                                            type="text"
                                            value={editForm.jobTitle}
                                            onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                                            className="w-full rounded bg-zinc-700 border-zinc-600 text-white text-sm px-3 py-2"
                                        />
                                    </div>
                                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-semibold">
                                        Save Changes
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="text-xs uppercase bg-zinc-800/50 text-zinc-200">
                                    <tr>
                                        <th className="px-6 py-3">Email</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Job Title</th>
                                        <th className="px-6 py-3">Site Location</th>
                                        <th className="px-6 py-3">Joined</th>
                                        <th className="px-6 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                                            <td className="px-6 py-4 font-medium text-white">{u.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-purple-900 text-purple-200' : u.role === 'manager' ? 'bg-blue-900 text-blue-200' : 'bg-zinc-700 text-zinc-300'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{u.jobTitle}</td>
                                            <td className="px-6 py-4">{u.siteLocation || "-"}</td>
                                            <td className="px-6 py-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleEditUser(u)}
                                                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center">No users found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Branches Tab */}
                {activeTab === 'branches' && (
                    <div className="space-y-6">
                        {/* Add Branch Form */}
                        <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                            <h2 className="text-xl font-semibold mb-4">Add New Branch / Site</h2>
                            <form onSubmit={handleAddBranch} className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Enter Site Name (e.g., Jakarta Pusat)"
                                    className="flex-1 rounded-lg border-0 bg-zinc-800 py-3 px-4 text-white shadow-sm ring-1 ring-inset ring-zinc-700 focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                                    value={newBranchName}
                                    onChange={(e) => setNewBranchName(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Add Site
                                </button>
                            </form>
                        </div>

                        {/* Branch List */}
                        <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                            <h2 className="text-xl font-semibold mb-4">Existing Sites</h2>
                            <ul className="space-y-3">
                                {branches.map((branch) => (
                                    <li key={branch.id} className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
                                        <span className="font-medium">{branch.name}</span>
                                        <button
                                            onClick={() => handleDeleteBranch(null, branch.id)}
                                            className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-900/20 transition-colors"
                                            title="Delete Branch"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </li>
                                ))}
                                {branches.length === 0 && (
                                    <p className="text-zinc-500 text-center py-4">No sites added yet.</p>
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Live Monitoring Tab */}
                {activeTab === 'monitoring' && (
                    <UserMonitoring />
                )}
            </div>
        </div >
    );
}
